require("dotenv").config();
const express = require("express")
const app = express()
const bcrypt = require("bcrypt")
const mongoose = require("mongoose")
const path = require("path")
const PORT = process.env.PORT || 5000
const cors = require("cors");
const { Server } = require("socket.io");
const http = require("http");
const MONGO_URI = process.env.MONGO_URI
const EARNINTERVAL = Number(process.env.EARNINTERVAL || 1000)
const crypto = require("crypto")
const QRCode = require("qrcode")
const multer = require("multer")
const jwt = require("jsonwebtoken");
const ORIGIN = process.env.ORIGIN || "*";
const JWT_SECRET = process.env.JWT_SECRET
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET
const MINING_DURATION_MS = 30 * 24 * 60 * 60 * 1000
const SALT_ROUNDS = 10;
const REFERRAL_BONUS_PERCENT = 10;
const TRANSFER_FEE_RATE = 0.015;
const MIN_WITHDRAWAL = 50;

const collection = require("./config")
const Transaction = require("./config2")
const Deposit = require("./config3")
const Message = require("./config4")




const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, "uploads")),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const base = crypto.randomBytes(16).toString("hex");
    cb(null, `${Date.now()}-${base}${ext}`);
  }
});

function fileFilter(req, file, cb) {
  if (file.mimetype === "image/png" || file.mimetype === "image/jpeg" || file.mimetype === "image/jpg") {
    cb(null, true);
  } else {
    cb(new Error("Only JPG/PNG images are allowed"), false);
  }
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }
});



app.use(express.json())

app.use(express.urlencoded({extended: true}))

app.use(express.static(path.join(__dirname, "public")));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use(cors({
  origin: ORIGIN,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true
}));


const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: ORIGIN, methods: ["GET", "POST"] }
});

function signAccessToken(payload) {
  // short lived
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "15m" });
}
function signRefreshToken(payload) {
  return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: "7d" });
}
function verifyAccessToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

// Middleware: authenticate via Bearer token in Authorization header
async function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ success: false, message: "Missing Authorization header" });
  const parts = header.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") return res.status(401).json({ success: false, message: "Invalid Authorization format" });
  const token = parts[1];
  try {
    const payload = verifyAccessToken(token);
    // attach minimal user info
    req.user = { id: payload.id, username: payload.username, role: payload.role };
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
}


// Refresh token
app.post("/token/refresh", async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(401).json({ success: false });

  try {
    const payload = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
    const newAccess = signAccessToken({ id: payload.id, username: payload.username, role: payload.role });
    return res.json({ success: true, accessToken: newAccess });
  } catch (err) {
    return res.status(401).json({ success: false, message: "Invalid refresh token" });
  }
})



app.get("/", (req, res) => res.sendFile(path.join(__dirname, "views/home.html")));
app.get("/signup", (req, res) => res.sendFile(path.join(__dirname, "views/signup.html")));
app.get("/login", (req, res) => res.sendFile(path.join(__dirname, "views/login.html")));
app.get("/deposit", (req, res) => res.sendFile(path.join(__dirname, "views/deposit.html")));
app.get("/dashboard", (req, res) => res.sendFile(path.join(__dirname, "views/dashboard.html")));
app.get("/withdrawal", (req, res) => res.sendFile(path.join(__dirname, "views/withdrawal.html")));
app.get("/transaction", (req, res) => res.sendFile(path.join(__dirname, "views/transaction.html")));
app.get("/settings", (req, res) => res.sendFile(path.join(__dirname, "views/settings.html")));
app.get("/FAQ", (req, res) => res.sendFile(path.join(__dirname, "views/FAQ.html")))
app.get("/privacy", (req, res) => res.sendFile(path.join(__dirname, "views/privacy.html")))
app.get("/terms", (req, res) => res.sendFile(path.join(__dirname, "views/terms.html")))
app.get("/trust-security", (req, res) => res.sendFile(path.join(__dirname, "views/trust-security.html")))
app.get("/recover", (req, res) => res.sendFile(path.join(__dirname, "views/recover.html")))








function generateRecoveryCodes() {
  const codes = [];

  for (let i = 0; i < 8; i++) {
    const code = Math.random().toString(36).substring(2, 10).toUpperCase();
    const codeHash = require("crypto")
      .createHash("sha256")
      .update(code)
      .digest("hex");

    codes.push({ plain: code, codeHash });
  }

  return codes;
}



app.post("/signup", async (req, res) => {

const { username, address, password, referredBy, acceptedTerms } = req.body;

const existUsers = await collection.findOne({username: username.toLowerCase()})

if (!username || !address || !password) {
  return res.json({ success: false, message: "All fields are required." })
}
if (!acceptedTerms) {
  return res.json({ success: false, message: "You must agree to the Terms & Conditions." })
}
if (password.length < 8) {
  return res.json({ success: false, message: "Password must be 8 characters long" })
}
if (existUsers) {
    return res.json({ success: false, message: "Username already exist" })
}
else {
  const referralCode = crypto.randomBytes(3).toString("hex");
  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS)
  const walletAddress = "TTwJJfz3cszvA94Qs3actavMvhh1x2rawu";
  const qr = await QRCode.toDataURL(walletAddress)
  const codes = generateRecoveryCodes();

const userData = await collection.create({
      username,
      address,
      referralCode,
      password: hashedPassword,
      depositAddress: walletAddress,
      qrCodeUrl: qr,
      referredBy: referredBy || null,
      acceptedTerms: true,
      recoveryCodes: codes.map(c => ({
      codeHash: c.codeHash,
      used: false,
    })),
    hasGivenReferralBonus: false
    })
    await userData.save()

    const safeUser = {
      username: userData.username,
      address: userData.address,
      referralCode: userData.referralCode,
      depositAddress: userData.depositAddress,
      qrCodeUrl: userData.qrCodeUrl
    };
console.log(safeUser)
res.json({ success: true, message: "Signup successful", user: safeUser, recoveryCodes: codes.map(c => c.plain) })
}
})




app.post("/contact", async (req, res) => {

    const { username, message } = req.body;

    if (!username || !message) {
      return res.json({
        success: false,
        message: "Username and message are required."
      });
    }
    if (message.length < 30) {
      return res.json({ success: false, message: "Message must be 30 characters long" 

      })
    }
    else {

    const userMessage = await Message.create({
      username,
      message
    });

    console.log("📩 New Message Saved:", userMessage);
    
    res.json({
      success: true,
      message: "Your message has been sent successfully!"
    });
  }
});




app.post("/login", async (req, res) => {
  try {
    let { username, password } = req.body;
    if (!username || !password) return res.json({ success: false, message: "Missing username or password" });
    username = username.toLowerCase();

    const user = await collection.findOne({ username });
    if (!user) return res.json({ success: false, message: "Invalid username or password" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.json({ success: false, message: "Invalid username or password" });


    const safeUser = {
      username: user.username,
      balance: user.balance,
      totalEarned: user.totalEarned,
      referralCode: user.referralCode,
      depositAddress: user.depositAddress,
      qrCodeUrl: user.qrCodeUrl,
      referralCount: user.referralCount || 0,
      isMining: user.isMining || false,
      miningEndsAt: user.miningEndsAt || null,
    };

    return res.json({ success: true, message: "Login successful", user: safeUser });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});




app.post("/recover", async (req, res) => {
  try {
    let { username, recoveryCode, newPassword } = req.body;
    if (!username || !recoveryCode || !newPassword) return res.json({ success: false, message: "All fields required" });
    username = username.toLowerCase();

    if (newPassword.length < 8) return res.json({ success: false, message: "Password must be at least 8 characters" });

    const user = await collection.findOne({ username });
    if (!user) return res.json({ success: false, message: "User not found" });

    const codeHash = crypto.createHash("sha256").update(recoveryCode).digest("hex");
    const codeEntry = user.recoveryCodes.find(c => c.codeHash === codeHash && !c.used);
    if (!codeEntry) return res.json({ success: false, message: "Invalid or used recovery code" });

    // mark used
    codeEntry.used = true;
    user.password = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await user.save();

    return res.json({ success: true, message: "Password reset successful" });
  } catch (err) {
    console.error("Recover error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});






app.post("/change-password", async (req, res) => {

  const { username, oldPassword, newPassword} = req.body

  const user = await collection.findOne({ username: username.toLowerCase() })
  if (!user) return res.json({ success: false, message: "User not found" })

     const match = await bcrypt.compare(oldPassword, user.password);
  if (!match) return res.json({ success: false, message: "Old password incorrect" });

  if (newPassword.length < 8) {
  return res.json({ success: false, message: "Password must be 8 characters long" })
}
if (!oldPassword || !newPassword) {
  return res.json({ success: false, message: "All fields are required." })
}

  user.password = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await user.save();

  res.json({ success: true, message: "Password updated successfully" });
})




app.post("/upload-proof", upload.single("proof"), async (req, res) => {
  try {
    const { username, amount, userId } = req.body;

    if (!req.file) {
      return res.json({ success: false, message: "No file uploaded" });
    }

    const deposit = new Deposit({
      username: userId,
      amount: Number(amount),
      imageUrl: "/uploads/" + req.file.filename,
      status: "pending",
      date: new Date()
    });

    await deposit.save();

    res.json({ success: true, message: "Proof uploaded successfully" });

  } catch (err) {
    console.log(err);
    res.json({ success: false, message: "Server error" });
  }
});






function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') return res.status(403).json({ success:false });
  next();
}



app.post("/admin/approve/:depositId", async (req, res) => {
  try {
    const dep = await Deposit.findById(req.params.depositId);
    if (!dep) return res.json({ success: false, message: "Deposit not found" });
    if (dep.status === "approved") return res.json({ success: false, message: "Already approved" });

    dep.status = "approved";
    await dep.save();

    // Add deposit amount to user balance
    const user = await collection.findById(dep.userId);
    if (!user) return res.json({ success: false, message: "User not found" });

    await collection.findByIdAndUpdate(dep.userId, { $inc: { balance: dep.amount }})

    // ================================
    // ✅ REFERRAL BONUS SYSTEM
    // ================================
    if (user.referredBy && !user.hasGivenReferralBonus) {
      const referrer = await collection.findOne({ referralCode: user.referredBy });

      if (referrer) {
        const bonusPercent = 10; // 10%
        const bonusAmount = (dep.amount * bonusPercent) / 100; // 10% of deposit

        referrer.balance += bonusAmount;
        referrer.referralCount = (referrer.referralCount || 0) + 1;

        user.hasGivenReferralBonus = true;

        await referrer.save();
        await user.save();
      }
    }

    return res.json({ success: true, message: "Deposit approved and balance updated" });

  } catch (err) {
    console.error("Approve deposit error:", err);
    return res.json({ success: false, message: "Server error" });
  }
});







app.post("/transfer", async (req, res) => {
  const { sender, receiver, amount } = req.body;
  const transferAmount = Number(amount);
  const feeRate = TRANSFER_FEE_RATE;
  const fee = transferAmount * feeRate;
  const totalDeduction = transferAmount + fee;

  if (transferAmount < MIN_WITHDRAWAL) {
    return res.json({ success: false, message: "Insufficient funds to withdraw" });
  }
  if (!sender || !receiver || !Number.isFinite(transferAmount) || transferAmount <= 0) {
    return res.json({ success: false, message: "Please enter valid wallet address and amount." });
    }

  const senderUser = await collection.findOne({ username: sender });
  if (!senderUser) return res.json({ success: false, message: "Sender not found" });

  const receiverUser = await collection.findOne({ address: receiver });
  if (!receiverUser) return res.json({ success: false, message: "Wallet address not found" });

  if (senderUser.isMining) {
    return res.json({
      success: false,
      message: "You cannot withdraw while earning is active."
    });
  }

  if (senderUser.username === receiverUser.username) {
    if (senderUser.balance < totalDeduction)
  return res.json({
    success: false,
    message: `Insufficient funds.`
  })

  const transaction = new Transaction({ sender: senderUser.username, senderAddress: senderUser.address, receiver: receiverUser.username, receiverAddress: receiverUser.address, type: "transfer", amount: transferAmount, fee });
  await transaction.save();

    await collection.findByIdAndUpdate(senderUser._id, { $inc: { balance: -totalDeduction } });
    await senderUser.save();

    return res.json({
      success: true,
      message: `Withdrawal request: ${transferAmount} USDT sent to ${receiver}. Fee: ${fee.toFixed(2)} USDT (1.5%). Total Deduction: ${totalDeduction.toFixed(
      2
    )} USDT`,
      newBalance: senderUser.balance
    });
  } 

  if (senderUser.balance < totalDeduction)
    return res.json({ success: false, message: "Insufficient funds" });

  await collection.findByIdAndUpdate(senderUser._id, { $inc: { balance: -totalDeduction } });
  await collection.findByIdAndUpdate(receiverUser._id, { $inc: { balance: transferAmount } })

  const bonus = REFERRAL_BONUS_PERCENT

  if (receiverUser.referredBy && !receiverUser.hasGivenReferralBonus) {
    const referrer = await collection.findOne({ referralCode: receiverUser.referredBy });

    if (referrer) {
      referrer.referralCount += 1;
      const bonusAmount = (receiverUser.balance * bonus) / 100;

      referrer.balance += bonusAmount;
      receiverUser.hasGivenReferralBonus = true;

      await referrer.save();
    }
  }

  const transaction = new Transaction({ sender: senderUser.username, senderAddress: senderUser.address, receiver: receiverUser.username, receiverAddress: receiverUser.address, type: "transfer", amount: transferAmount, fee });
  await transaction.save();

  await senderUser.save();
  await receiverUser.save();

const sockets = await io.fetchSockets()
    for (const sock of sockets) {
      if (sock.username === receiverUser.username) {
        sock.emit("balanceUpdate", { balance: receiverUser.balance });
      }
      if (sock.username === senderUser.username) {
        sock.emit("balanceUpdate", { balance: senderUser.balance });
      }
    }

  res.json({
  success: true,
  message: `Withdrawal request: ${transferAmount} USDT sent to ${receiver}. Fee: ${fee.toFixed(2)} USDT (1.5%). Total Deduction: ${totalDeduction.toFixed(
      2
    )} USDT`,
  newBalance: senderUser.balance,
  fee: fee.toFixed(2),
  totalDeduction: totalDeduction.toFixed(2),
});
});



app.get("/transactions/:username", async (req, res) => {
  try {
    const username = req.params.username.toLowerCase();
    const txs = await Transaction.find({ $or: [{ sender: username }, { receiver: username }] }).sort({ date: -1 }).limit(200);
    return res.json({ success: true, transactions: txs });
  } catch (err) {
    console.error("Transactions error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});


app.get("/deposits/:username", async (req, res) => {
  try {
    const username = req.params.username.toLowerCase();
    const user = await collection.findOne({ username });
    if (!user) return res.json({ success: false, message: "User not found" });
    const deposits = await Deposit.find({ userId: user._id }).sort({ date: -1 });
    return res.json({ success: true, deposits });
  } catch (err) {
    console.error("Deposit fetch error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});


app.get("/withdrawal/:username", async (req, res) => {
  try {
    const username = req.params.username.toLowerCase();
    const withdraws = await Transaction.find({ sender: username, type: "withdrawal" }).sort({ date: -1 });
    return res.json({ success: true, withdraws });
  } catch (err) {
    console.error("Withdrawal fetch error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});





io.on("connection", (socket) => {
  console.log("🟢 A user connected", socket.id);

  socket.on("joinUser", async (username) => {
    try {
      if (!username) return;

      socket.username = username.toLowerCase();

      const user = await collection.findOne({ username: socket.username });
      if (!user) {
        socket.emit("errorMessage", "User not found");
        return;
      }

      socket.emit("init", {
        username: user.username,
        balance: user.balance,
        totalEarned: user.totalEarned,
        isMining: user.isMining,
        miningEndsAt: user.miningEndsAt
      });
    } catch (err) {
      console.error("joinUser error:", err);
    }
  });


  socket.on("startMining", async () => {
    if (!socket.username) {
      socket.emit("errorMessage", "You must join first");
      return;
    }

    const user = await collection.findOne({ username: socket.username });
    if (!user || user.balance < MIN_WITHDRAWAL) {
      socket.emit("errorMessage", "Balance is low.");
      return
    }

    if (user.isMining) {
      socket.emit("miningStarted");
      return;
    }

    const miningDuration = MINING_DURATION_MS
    const now = Date.now();

    user.isMining = true;
    user.miningStartedAt = now;
    user.miningEndsAt = now + miningDuration;

    await user.save();

    socket.emit("miningStarted");
  });
  


  socket.on("disconnect", () => {
    console.log("🔴 User disconnected", socket.id, "username:", socket.username);
  });
});



function startMiningLoop() {
setInterval(async () => {
  const now = Date.now();

  const miners = await collection.find({
    isMining: true,
    miningEndsAt: { $gt: now }
  });

  for (const user of miners) {
    try {
      const earned = Number((user.balance * 0.000001043).toFixed(6));

      user.balance += earned;
      user.totalEarned += earned;
      await user.save();

      const sockets = await io.fetchSockets();
      for (const sock of sockets) {
        if (sock.username === user.username) {
          sock.emit("earn", {
            earned,
            balance: user.balance,
            totalEarned: user.totalEarned,
            date: new Date()
          });
        }
      }
    } catch (err) {
      console.error("GLOBAL MINING ERROR:", err);
    }
  }

  await collection.updateMany(
    { isMining: true, miningEndsAt: { $lte: now } },
    { isMining: false }
  );
}, EARNINTERVAL);
}


mongoose.connect(MONGO_URI, {
})
.then(() => {
  console.log("✅ MongoDB connected");

  server.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
  });
  startMiningLoop()
})
.catch((err) => {
  console.error("❌ MongoDB connection failed:", err.message);
  process.exit(1);
});



