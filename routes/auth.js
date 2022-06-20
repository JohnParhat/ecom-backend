const router = require('express').Router();
const { request } = require('express');
const User = require('../models/User');
const CryptoJS = require('crypto-js');
const jwt = require('jsonwebtoken');

//Register
router.post('/register', async (req, res) => {
  const body = req.body;
  console.log(body);
  const { firstname, lastname, username, email, password } = body;
  const userNameExist = await User.findOne({
    username: username,
  });
  const emailExist = await User.findOne({ email: email });

  if (firstname && lastname && body.username && password && email) {
    if (userNameExist || emailExist) {
      if (userNameExist) {
        res.status(400).json({
          message: 'username is already registered!',
        });
      } else {
        res.status(400).json({
          message: 'email is already registered!',
        });
      }
    } else {
      const newUser = new User({
        firstname: req.body.firstname,
        lastname: req.body.lastname,
        username: req.body.username,
        email: req.body.email,
        password: CryptoJS.AES.encrypt(
          body.password,
          process.env.PASS_SEC
        ).toString(),
      });

      try {
        const savedUser = await newUser.save();
        res.status(201).json(savedUser);
      } catch (error) {
        res.status(500).json(error);
      }
    }
  } else {
    if (Object.keys(body).length === 0) {
      res.status(400).json({
        message: {
          firstname: 'is required!',
          lastname: 'is required!',
          username: 'is required!',
          email: 'is required!',
          password: 'is required!',
        },
      });
    } else if (!firstname) {
      res.status(400).json({
        message: 'firstname is required',
      });
    } else if (!lastname) {
      res.status(400).json({
        message: 'lastname is required',
      });
    } else if (!username) {
      res.status(400).json({
        message: 'username is required',
      });
    } else if (!email) {
      res.status(400).json({
        message: 'email is required',
      });
    } else if (!password) {
      res.status(400).json({
        message: 'password is required',
      });
    }
  }
});

//LOGIN
router.post('/login', async (req, res) => {
  try {
    console.log(req.body);
    const user = await User.findOne({ username: req.body.username });
    !user && res.status(401).json('Invalid username or password');

    const hashPassword = CryptoJS.AES.decrypt(
      user.password,
      process.env.PASS_SEC
    );

    const originalPassword = hashPassword.toString(CryptoJS.enc.Utf8);
    console.log('=====>' + originalPassword);
    originalPassword !== req.body.password &&
      res.status(401).json('invalid username or password');

    const accessToken = jwt.sign(
      {
        id: user._id,
        isAdmin: user.isAdmin,
      },
      process.env.JWT_SEC,
      {
        expiresIn: '1d',
      }
    );

    const { password, ...others } = user._doc;
    res.status(200).json({
      user: { ...others },
      accessToken,
    });
  } catch (err) {
    res.status(500).json(err);
    console.log(err);
  }
});

module.exports = router;
