require("dotenv").config();
import fs from "fs";
import { Promise } from "bluebird";
import { ChromaInstance } from "./services/chroma";
import _ from "lodash";
import { PDFLoader } from "langchain/document_loaders/fs/pdf";

const PDF_FOLDER_PATH = "./pdf-articles";

main();
async function main() {
  try {
    console.log("Importing data from pdf files...");

    await crawlData();

    console.log("DONE");
  } catch (err) {
    console.log(err);
  }
}

async function crawlData() {
  const collection = await ChromaInstance.ensureCollection();
  await collection.delete();

  const fileNames = fs.readdirSync(PDF_FOLDER_PATH);

  await Promise.map(fileNames, crawlDataByPDF, {
    concurrency: 4,
  });
}

async function crawlDataByPDF(fileName) {
  const loader = new PDFLoader(`${PDF_FOLDER_PATH}/${fileName}`);

  const docs = await loader.load();

  docs[0].pageContent = `Paper name: ${fileName} \n ${docs[0].pageContent}`;

  // reduce number of docs is inserted in one time
  const docChunks = _.chunk(docs, 100);
  await Promise.map(
    docChunks,
    (docChunk) => ChromaInstance.addDocuments(docChunk),
    {
      concurrency: 4,
    }
  );
}
