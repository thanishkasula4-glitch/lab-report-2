const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();

// Middleware to parse incoming JSON request bodies
app.use(express.json());

// Path to the SQLite database file
const dbPath = path.join(__dirname, "database.db");

// Global database instance
let db = null;

// Asynchronous function to initialize Database connection and start the Server
const initializeDBAndServer = async () => {
  try {
    // 1. Open the SQLite database connection
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    console.log("Connected to the SQLite database successfully.");

    // 2. Start the Express server only AFTER database connection is ready
    const PORT = 3000;
    app.listen(PORT, () => {
      console.log(`Server is running at http://localhost:${PORT}/`);
    });
  } catch (error) {
    console.error(`Database Error: ${error.message}`);
    process.exit(1);
  }
};

// Start initialization
initializeDBAndServer();

// ==========================================
// CRUD ROUTES FOR BOOKS
// ==========================================

// 1. GET ALL BOOKS
// Endpoint: GET /books/
// Purpose: Fetch all book records from the database
app.get("/books/", async (request, response) => {
  try {
    const getBooksQuery = `
      SELECT
        *
      FROM
        book
      ORDER BY
        id ASC;
    `;
    const booksArray = await db.all(getBooksQuery);
    response.status(200).json(booksArray);
  } catch (error) {
    console.error("Error fetching books:", error.message);
    response.status(500).json({ error: "Internal Server Error" });
  }
});

// 2. GET SINGLE BOOK BY ID
// Endpoint: GET /books/:bookId/
// Purpose: Fetch a specific book record using its unique ID
app.get("/books/:bookId/", async (request, response) => {
  try {
    const { bookId } = request.params;

    // Parameterized query using '?' placeholder to prevent SQL Injection
    const getBookQuery = `
      SELECT
        *
      FROM
        book
      WHERE
        id = ?;
    `;

    const book = await db.get(getBookQuery, [bookId]);

    // Check if the book was found
    if (book === undefined) {
      response.status(404).json({ error: "Book not found" });
    } else {
      response.status(200).json(book);
    }
  } catch (error) {
    console.error("Error fetching book:", error.message);
    response.status(500).json({ error: "Internal Server Error" });
  }
});

// 3. POST (CREATE) A NEW BOOK
// Endpoint: POST /books/
// Purpose: Add a new book to the database
app.post("/books/", async (request, response) => {
  try {
    const { title, author, price, pages } = request.body;

    // Input validation
    if (!title || !author || price === undefined || pages === undefined) {
      return response.status(400).json({
        error: "All fields (title, author, price, pages) are required",
      });
    }

    // Parameterized query using '?' placeholders to prevent SQL Injection
    const addBookQuery = `
      INSERT INTO
        book (title, author, price, pages)
      VALUES
        (?, ?, ?, ?);
    `;

    const dbResponse = await db.run(addBookQuery, [
      title,
      author,
      price,
      pages,
    ]);

    // Return 201 Created status with the newly generated book ID
    response.status(201).json({
      message: "Book Added Successfully",
      bookId: dbResponse.lastID,
    });
  } catch (error) {
    console.error("Error creating book:", error.message);
    response.status(500).json({ error: "Internal Server Error" });
  }
});

// 4. PUT (UPDATE) AN EXISTING BOOK
// Endpoint: PUT /books/:bookId/
// Purpose: Update all fields of an existing book
app.put("/books/:bookId/", async (request, response) => {
  try {
    const { bookId } = request.params;
    const { title, author, price, pages } = request.body;

    // Input validation
    if (!title || !author || price === undefined || pages === undefined) {
      return response.status(400).json({
        error: "All fields (title, author, price, pages) are required",
      });
    }

    // Parameterized query using '?' placeholders to prevent SQL Injection
    const updateBookQuery = `
      UPDATE
        book
      SET
        title = ?,
        author = ?,
        price = ?,
        pages = ?
      WHERE
        id = ?;
    `;

    const dbResponse = await db.run(updateBookQuery, [
      title,
      author,
      price,
      pages,
      bookId,
    ]);

    // If changes === 0, the bookId does not exist
    if (dbResponse.changes === 0) {
      response.status(404).json({ error: "Book not found" });
    } else {
      response.status(200).json({ message: "Book Updated Successfully" });
    }
  } catch (error) {
    console.error("Error updating book:", error.message);
    response.status(500).json({ error: "Internal Server Error" });
  }
});

// 5. DELETE A BOOK
// Endpoint: DELETE /books/:bookId/
// Purpose: Remove a book record by its ID
app.delete("/books/:bookId/", async (request, response) => {
  try {
    const { bookId } = request.params;

    // Parameterized query using '?' placeholder to prevent SQL Injection
    const deleteBookQuery = `
      DELETE FROM
        book
      WHERE
        id = ?;
    `;

    const dbResponse = await db.run(deleteBookQuery, [bookId]);

    // If changes === 0, the bookId does not exist
    if (dbResponse.changes === 0) {
      response.status(404).json({ error: "Book not found" });
    } else {
      response.status(200).json({ message: "Book Deleted Successfully" });
    }
  } catch (error) {
    console.error("Error deleting book:", error.message);
    response.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = app;
