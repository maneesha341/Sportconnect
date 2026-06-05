const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

app.use('/api/auth',          require('./routes/auth'));
app.use('/api/trainers',      require('./routes/trainers'));
app.use('/api/slots',         require('./routes/slots'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/bookings',      require('./routes/bookings'));
app.use('/api/messages',      require('./routes/messages'));
app.use('/api/ai',            require('./routes/ai'));
app.use('/api/admin',         require('./routes/admin'));

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB error:', err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));