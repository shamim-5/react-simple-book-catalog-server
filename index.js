const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

require("dotenv").config();

const port = process.env.PORT || 9000;
const app = express();

// middlewares
app.use(express.json());
app.use(cors());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.hvfqmi4.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();

    const bookCollection = client.db("book-catalog").collection("books");

    app.get("/books", async (req, res) => {
      const { field, searchTerm } = req.query;
      let query = {};

      if (field && searchTerm) {
        query[field] = { $regex: searchTerm, $options: "i" };
      } else if (field) {
        query[field] = "";
      } else if (searchTerm) {
        query = {
          $or: [{ title: { $regex: searchTerm, $options: "i" } }, { author: { $regex: searchTerm, $options: "i" } }],
        };
      }

      try {
        const books = await bookCollection.find(query).toArray();
        res.status(200).send(books);
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: "An error occurred while fetching books." });
      }
    });

    app.get("/books/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const book = await bookCollection.findOne(query);

      res.status(200).send(book);
    });

    app.post("/books", async (req, res) => {
      const book = req.body;
      const result = await bookCollection.insertOne(book);

      res.status(200).send(result);
    });

    app.patch("/books/:id", async (req, res) => {
      const id = req.params.id;
      const book = req.body;
      const filter = { _id: new ObjectId(id) };

      const bookId = book._id ? { _id: new ObjectId(book._id) } : {};

      const updatedBook = {
        $set: {
          ...book,
          ...bookId,
        },
      };
      const result = await bookCollection.updateOne(filter, updatedBook);

      res.status(200).send(result);
    });

    app.delete("/books/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await bookCollection.deleteOne(query);

      res.status(200).send(result);
    });
  } finally {
    // do nothing
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("RS_Book-Catalog server connected");
});

app.listen(port, () => {
  console.log(`Listening on port: ${port}`);
});
