#!/bin/sh
mkdir model
cd model
wget https://github.com/justadudewhohacks/face-api.js/raw/master/weights/face_landmark_68_model-shard1
wget https://github.com/justadudewhohacks/face-api.js/raw/master/weights/face_landmark_68_model-weights_manifest.json
wget https://github.com/justadudewhohacks/face-api.js/raw/master/weights/face_landmark_68_tiny_model-shard1
wget https://github.com/justadudewhohacks/face-api.js/raw/master/weights/face_landmark_68_tiny_model-weights_manifest.json
wget https://github.com/justadudewhohacks/face-api.js/raw/master/weights/face_recognition_model-shard1
wget  https://github.com/justadudewhohacks/face-api.js/raw/master/weights/face_recognition_model-shard2
wget  https://github.com/justadudewhohacks/face-api.js/raw/master/weights/face_recognition_model-weights_manifest.json
wget https://github.com/justadudewhohacks/face-api.js/raw/master/weights/ssd_mobilenetv1_model-shard1
wget  https://github.com/justadudewhohacks/face-api.js/raw/master/weights/ssd_mobilenetv1_model-shard2
wget  https://github.com/justadudewhohacks/face-api.js/raw/master/weights/ssd_mobilenetv1_model-weights_manifest.json

cd ..
wget https://upload.wikimedia.org/wikipedia/commons/thumb/3/33/Tom_Cruise_by_Gage_Skidmore_2.jpg/1280px-Tom_Cruise_by_Gage_Skidmore_2.jpg -O query.jpg
mkdir images
wget https://penn-cis545-files.s3.amazonaws.com/imdb-faces.zip
cd images
unzip ../imdb-faces.zip
cd ..
rm imdb-faces.zip