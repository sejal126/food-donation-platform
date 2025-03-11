const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
app.use(bodyParser.json());
app.use(cors());

mongoose.connect('mongodb://localhost:27017/food-donation', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const UserSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  role: { type: String, default: 'user' }
});

const DonationSchema = new mongoose.Schema({
  donorName: String,
  foodType: String,
  quantity: String,
  location: String,
  contact: String,
  status: { type: String, default: 'Pending' }
});

const User = mongoose.model('User', UserSchema);
const Donation = mongoose.model('Donation', DonationSchema);

app.post('/signup', async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).send({ message: 'User already exists!' });
    }

    const user = new User({ name, email, password });
    await user.save();
    res.send({ message: 'User registered successfully!' });
  } catch (error) {
    res.status(500).send({ message: 'Internal server error' });
  }
});

app.post('/signin', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email, password });
    if (!user) {
      return res.status(400).send({ message: 'Invalid credentials' });
    }

    res.send({ message: 'Sign in successful', user });
  } catch (error) {
    res.status(500).send({ message: 'Internal server error' });
  }
});

app.post('/donate', async (req, res) => {
  const { donorName, foodType, quantity, location, contact } = req.body;

  try {
    const donation = new Donation({ donorName, foodType, quantity, location, contact });
    await donation.save();
    res.send({ message: 'Donation added successfully!' });
  } catch (error) {
    res.status(500).send({ message: 'Internal server error' });
  }
});

app.get('/users', async (req, res) => {
  const users = await User.find();
  res.send(users);
});

app.get('/donations', async (req, res) => {
  const donations = await Donation.find();
  res.send(donations);
});

app.put('/update-donation/:id', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const donation = await Donation.findByIdAndUpdate(id, { status });
    res.send({ message: 'Donation status updated!' });
  } catch (error) {
    res.status(500).send({ message: 'Internal server error' });
  }
});

app.delete('/delete-donation/:id', async (req, res) => {
  const { id } = req.params;

  try {
    await Donation.findByIdAndDelete(id);
    res.send({ message: 'Donation deleted successfully!' });
  } catch (error) {
    res.status(500).send({ message: 'Internal server error' });
  }
});

app.use(express.static('public'));

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
