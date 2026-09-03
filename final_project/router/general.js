const express = require('express');
const axios = require('axios');
let books = require("./booksdb.js");
let isValid = require("./auth_users.js").isValid;
let users = require("./auth_users.js").users;
const public_users = express.Router();

const BASE_URL = "http://localhost:5000";

// Register a new user
public_users.post("/register", (req, res) => {
  const username = req.body.username;
  const password = req.body.password;

  if (!username || !password) {
    return res.status(400).json({ message: "Username and password are required." });
  }

  // Reject if the username is already taken.
  if (users.some((user) => user.username === username)) {
    return res.status(409).json({ message: "User already exists!" });
  }

  users.push({ username, password });
  return res.status(200).json({ message: "User successfully registered. Now you can login." });
});

// ---------------------------------------------------------------------------
// Task 1-5 : synchronous access to the local books database
// Task 10-13: the SAME endpoints re-implemented with Axios + async/await /
//             promise callbacks (the functions below the routes).
// ---------------------------------------------------------------------------

// Get the book list available in the shop
public_users.get('/', async function (req, res) {
  try {
    const getBooks = new Promise((resolve) => resolve(books));
    const bookList = await getBooks;
    return res.status(200).send(JSON.stringify(bookList, null, 4));
  } catch (error) {
    return res.status(500).json({ message: "Error retrieving books" });
  }
});

// Get book details based on ISBN
public_users.get('/isbn/:isbn', async function (req, res) {
  try {
    const isbn = req.params.isbn;
    const getByIsbn = new Promise((resolve, reject) => {
      const book = books[isbn];
      if (book) resolve(book);
      else reject(new Error("Book not found"));
    });
    const book = await getByIsbn;
    return res.status(200).json(book);
  } catch (error) {
    return res.status(404).json({ message: "Book not found for the provided ISBN" });
  }
});

// Get book details based on author
public_users.get('/author/:author', async function (req, res) {
  try {
    const author = req.params.author;
    const getByAuthor = new Promise((resolve) => {
      const result = {};
      Object.keys(books).forEach((isbn) => {
        if (books[isbn].author === author) result[isbn] = books[isbn];
      });
      resolve(result);
    });
    const matches = await getByAuthor;
    if (Object.keys(matches).length === 0) {
      return res.status(404).json({ message: "No books found for the provided author" });
    }
    return res.status(200).json(matches);
  } catch (error) {
    return res.status(500).json({ message: "Error retrieving books by author" });
  }
});

// Get all books based on title
public_users.get('/title/:title', async function (req, res) {
  try {
    const title = req.params.title;
    const getByTitle = new Promise((resolve) => {
      const result = {};
      Object.keys(books).forEach((isbn) => {
        if (books[isbn].title === title) result[isbn] = books[isbn];
      });
      resolve(result);
    });
    const matches = await getByTitle;
    if (Object.keys(matches).length === 0) {
      return res.status(404).json({ message: "No books found for the provided title" });
    }
    return res.status(200).json(matches);
  } catch (error) {
    return res.status(500).json({ message: "Error retrieving books by title" });
  }
});

// Get book review
public_users.get('/review/:isbn', function (req, res) {
  const isbn = req.params.isbn;
  const book = books[isbn];
  if (book) {
    return res.status(200).json(book.reviews);
  }
  return res.status(404).json({ message: "Book not found for the provided ISBN" });
});

// ===========================================================================
// Task 10 : Get all books – using async/await with Axios
// ===========================================================================
async function getAllBooks() {
  try {
    const response = await axios.get(`${BASE_URL}/`);
    console.log("All books:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error fetching books:", error.message);
  }
}

// ===========================================================================
// Task 11 : Search by ISBN – using Promise callbacks with Axios
// ===========================================================================
function getBookByISBN(isbn) {
  return axios
    .get(`${BASE_URL}/isbn/${isbn}`)
    .then((response) => {
      console.log(`Book with ISBN ${isbn}:`, response.data);
      return response.data;
    })
    .catch((error) => {
      console.error("Error fetching book by ISBN:", error.message);
    });
}

// ===========================================================================
// Task 12 : Search by Author – using async/await with Axios
// ===========================================================================
async function getBooksByAuthor(author) {
  try {
    const response = await axios.get(`${BASE_URL}/author/${encodeURIComponent(author)}`);
    console.log(`Books by ${author}:`, response.data);
    return response.data;
  } catch (error) {
    console.error("Error fetching books by author:", error.message);
  }
}

// ===========================================================================
// Task 13 : Search by Title – using Promise callbacks with Axios
// ===========================================================================
function getBooksByTitle(title) {
  return axios
    .get(`${BASE_URL}/title/${encodeURIComponent(title)}`)
    .then((response) => {
      console.log(`Books titled "${title}":`, response.data);
      return response.data;
    })
    .catch((error) => {
      console.error("Error fetching books by title:", error.message);
    });
}

module.exports.general = public_users;
module.exports.getAllBooks = getAllBooks;
module.exports.getBookByISBN = getBookByISBN;
module.exports.getBooksByAuthor = getBooksByAuthor;
module.exports.getBooksByTitle = getBooksByTitle;
