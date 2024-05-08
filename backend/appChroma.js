/***
 * Face-API embedding computations.
 * 
 * We will be embedding each face.
 * 
 * For NETS 2120
 * 
 * Derived from the face-api.js example code, https://github.com/vladmandic/face-api/blob/master/demo/node-face-compare.js
 */

// Setup
var path = require('path');
const { ChromaClient } = require("chromadb");
const fs = require('fs');
const tf = require('@tensorflow/tfjs-node');
const faceapi = require('@vladmandic/face-api');


let optionsSSDMobileNet;

/**
 * Helper function, converts "descriptor" Int32Array to JavaScript array
 * @param {Int32Array} array 
 * @returns JavaScript array
 */
const getArray = (array) => {
  var ret = [];
  for (var i = 0; i < array.length; i++) {
    ret.push(array[i]);
  }
  return ret;
}


/**
 * Compute the face embeddings within an image file
 * 
 * @param {*} imageFile 
 * @returns List of detected faces' embeddings
 */
async function getEmbeddings(imageFile) {
  const buffer = fs.readFileSync(imageFile);
  const tensor = tf.node.decodeImage(buffer, 3);

  const faces = await faceapi.detectAllFaces(tensor, optionsSSDMobileNet)
    .withFaceLandmarks()
    .withFaceDescriptors();
  tf.dispose(tensor);

  // For each face, get the descriptor and convert to a standard array
  return faces.map((face) => getArray(face.descriptor));
};

async function initializeFaceModels() {
  console.log("Initializing FaceAPI...");

  await tf.ready();
  await faceapi.nets.ssdMobilenetv1.loadFromDisk('model');
  optionsSSDMobileNet = new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5, maxResults: 1 });
  await faceapi.nets.faceLandmark68Net.loadFromDisk('model');
  await faceapi.nets.faceRecognitionNet.loadFromDisk('model');

  return;
}

/**
 * Given a list of images, index their embeddings
 * within the ChromaDB collection.
 * 
 * @param {*} pathName Path to image
 * @param {*} image Image filename
 * @param {*} collection ChromaDB collection
 */
async function indexAllFaces(pathName, image, collection) {
  const embeddings = await getEmbeddings(pathName);

  var success = true;
  var inx = 1;
  for (var embedding of embeddings) {
    const data = {
      ids: [image + '-' + inx++],
      embeddings: [
        embedding,
      ],
      metadatas: [{ source: "imdb" } ],
      documents: [ image ],
    };
    var res = await collection.add(data);

    if (res === true) {
      console.info("Added image embedding for " + image + " to collection.");
    } else {
      console.error(res.error);
      success = false;
    }
  }
  return success;
}

async function findTopKMatches(collection, image, k) {
  var ret = [];

  var queryEmbeddings = await getEmbeddings(image);
  for (var queryEmbedding of queryEmbeddings) {
    var results = await collection.query({
      queryEmbeddings: queryEmbedding,
      // By default embeddings aren't returned -- if you want
      // them you need to uncomment this line
      // include: ['embeddings', 'documents', 'metadatas'],
      nResults: k
    });

    ret.push(results);
  }
  return ret;
}

/**
 * Example: Compare two images in files directly using FaceAPI
 * 
 * @param {*} file1 
 * @param {*} file2 
 */
async function compareImages(file1, file2) {
  console.log('Comparing images:', file1, file2); // eslint-disable-line no-console

  const desc1 = await getEmbeddings(file1);
  const desc2 = await getEmbeddings(file2);

  // Euclidean distance or L2 distance between two face descriptors
  const distance = faceapi.euclideanDistance(desc1[0], desc2[0]); // only compare first found face in each image
  console.log('L2 distance between most prominent detected faces:', distance); // eslint-disable-line no-console
  console.log('Similarity between most prominent detected faces:', 1 - distance); // eslint-disable-line no-console
};

////////////////////////
// Main

const client = new ChromaClient();
initializeFaceModels()
.then(async () => {

  const collection = await client.getOrCreateCollection({
    name: "face-api",
    embeddingFunction: null,
    // L2 here is squared L2, not Euclidean distance
    metadata: { "hnsw:space": "l2" },
  });

  console.info("Looking for files");
  const promises = [];
  // Loop through all the files in the images directory
  fs.readdir("images", function (err, files) {
    if (err) {
      console.error("Could not list the directory.", err);
      process.exit(1);
    }

    files.forEach(function (file, index) {
      console.info("Adding task for " + file + " to index.");
      promises.push(indexAllFaces(path.join("images", file), file, collection));
    });
    console.info("Done adding promises, waiting for completion.");
    Promise.all(promises)
    .then(async (results) => {
      console.info("All images indexed.");
  
      const search = 'query.jpg';
  
      console.log('\nTop-k indexed matches to ' + search + ':');
      for (var item of await findTopKMatches(collection, search, 5)) {
        for (var i = 0; i < item.ids[0].length; i++) {
          console.log(item.ids[0][i] + " (Euclidean distance = " + Math.sqrt(item.distances[0][i]) + ") in " + item.documents[0][i]);
        }
      }
    
    })
    .catch((err) => {
      console.error("Error indexing images:", err);
    });
    });

});

