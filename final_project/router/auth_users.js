const express = require('express');
const jwt = require('jsonwebtoken');
let books = require("./booksdb.js");
const regd_users = express.Router();

let users = [];

// Returns true when the username is free to use (not already registered).
const isValid = (username) => {
  return !users.some((user) => user.username === username);
}

// Returns true when a username/password pair matches a registered user.
const authenticatedUser = (username, password) => {
  return users.some(
    (user) => user.username === username && user.password === password
  );
}

// Only registered users can login
regd_users.post("/login", (req, res) => {
  const username = req.body.username;
  const password = req.body.password;

  if (!username || !password) {
    return res.status(404).json({ message: "Error logging in: username and password required" });
  }

  if (authenticatedUser(username, password)) {
    let accessToken = jwt.sign({ data: username }, "access", { expiresIn: 60 * 60 });
    req.session.authorization = { accessToken, username };
    return res.status(200).json({ message: "User successfully logged in", token: accessToken });
  }

  return res.status(208).json({ message: "Invalid Login. Check username and password" });
});

// Add or modify a book review for the logged-in user
regd_users.put("/auth/review/:isbn", (req, res) => {
  const isbn = req.params.isbn;
  const review = req.query.review;
  const username = req.session.authorization.username;
  const book = books[isbn];

  if (!book) {
    return res.status(404).json({ message: "Book not found for the provided ISBN" });
  }
  if (!review) {
    return res.status(400).json({ message: "Review text is required (pass it as ?review=...)" });
  }

  book.reviews[username] = review;
  return res.status(200).json({
    message: `The review for the book with ISBN ${isbn} has been added/updated by ${username}.`,
    reviews: book.reviews,
  });
});

// Delete the logged-in user's review for a book
regd_users.delete("/auth/review/:isbn", (req, res) => {
  const isbn = req.params.isbn;
  const username = req.session.authorization.username;
  const book = books[isbn];

  if (!book) {
    return res.status(404).json({ message: "Book not found for the provided ISBN" });
  }

  if (book.reviews[username]) {
    delete book.reviews[username];
    return res.status(200).json({
      message: `The review for the book with ISBN ${isbn} posted by ${username} has been deleted.`,
      reviews: book.reviews,
    });
  }

  return res.status(404).json({ message: `No review by ${username} found for ISBN ${isbn}` });
});

module.exports.authenticated = regd_users;
module.exports.isValid = isValid;
module.exports.authenticatedUser = authenticatedUser;
module.exports.users = users;
