import React from 'react';
import { View, Image, StyleSheet, ScrollView, Dimensions } from 'react-native';
import ImageZoom from 'react-native-image-pan-zoom';

const { width, height } = Dimensions.get('window');

export default function FareMatrixScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={{ alignItems: 'center' }}>
      <View style={styles.imageWrapper}>
        <ImageZoom
          cropWidth={width}
          cropHeight={height / 2}   // half screen height
          imageWidth={width}
          imageHeight={height / 2}
        >
          <Image
            source={require('../../../assets/fare-matrix1.png')}
            style={styles.image}
            resizeMode="contain"
          />
        </ImageZoom>
      </View>

      <View style={styles.imageWrapper}>
        <ImageZoom
          cropWidth={width}
          cropHeight={height / 2}
          imageWidth={width}
          imageHeight={height / 2}
        >
          <Image
            source={require('../../../assets/fare-matrix2.png')}
            style={styles.image}
            resizeMode="contain"
          />
        </ImageZoom>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  imageWrapper: { width: '100%', height: height / 2 }, // controls spacing
  image: { width: '100%', height: '100%' },
});
