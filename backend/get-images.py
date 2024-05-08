import pandas as pd
import urllib.request

faces = pd.read_csv('IMDb-Face.csv')
names = pd.read_csv('names.csv')

desired = names.merge(faces, left_on='nconst', right_on='index')[['nconst', 'name', 'image', 'url']]

# There are actually multiple images per actor, we will just go with the first
first_images = desired.groupby(by='nconst').first().reset_index()
first_images.to_csv('desired.csv')

for i, row in first_images.iterrows():
    try:
        urllib.request.urlretrieve(row['url'], 'images/' + row['nconst'] + '.jpg')
    except:
        print('Failed to download image for ' + row['name'])