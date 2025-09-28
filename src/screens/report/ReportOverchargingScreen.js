import React, { useState, useEffect } from "react";
import {
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Platform,
  StatusBar,
  Image,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { db, auth } from "../../services/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { uploadMediaAsync } from "../../utils/uploadMedia";

export default function ReportOverchargingScreen({ navigation, route }) {
  const { mtopNumber: passedMtop } = route.params || {};
  const [mtopNumber, setMtopNumber] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState(null);

  useEffect(() => {
    if (passedMtop) setMtopNumber(passedMtop);
  }, [passedMtop]);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission denied", "Camera roll permission is required!");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaType.Images, // only images
      allowsEditing: true,
      quality: 0.7,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImage(result.assets[0]);
    }
  };

  const handleSubmit = async () => {
    if (!mtopNumber || !description) {
      Alert.alert("Required", "Please fill out all fields.");
      return;
    }

    try {
      let imageUrl = null;

      if (image) {
        const fileName = `${Date.now()}-${image.fileName || "upload"}`;
        imageUrl = await uploadMediaAsync(image.uri, `reports/${fileName}`);
      }

      await addDoc(collection(db, "reports"), {
        type: "Overcharging",
        mtopNumber,
        description,
        imageUrl,
        timestamp: serverTimestamp(),
        userId: auth.currentUser?.uid || null,
        userName:
          auth.currentUser?.displayName ||
          auth.currentUser?.email ||
          "Anonymous",
      });

      Alert.alert("Report Saved", "Your report has been uploaded.");
      setDescription("");
      setImage(null);
    } catch (err) {
      console.error("Failed to save report:", err);
      Alert.alert("Error", "Failed to save report. Check console for details.");
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.label}>MTOP Number</Text>
        <TextInput
          style={styles.input}
          value={mtopNumber}
          editable={false} // ✅ MTOP cannot be edited
          placeholderTextColor="#999"
        />

        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.textarea]}
          placeholder="Describe the incident"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={5}
          placeholderTextColor="#999"
        />

        <TouchableOpacity style={styles.secondaryButton} onPress={pickImage}>
          <Text style={styles.secondaryButtonText}>
            {image ? "Change Photo" : "Upload Photo"}
          </Text>
        </TouchableOpacity>

        {image && (
          <Image
            source={{ uri: image.uri }}
            style={{ width: "100%", height: 200, marginVertical: 10 }}
            resizeMode="contain"
          />
        )}

        <TouchableOpacity style={styles.button} onPress={handleSubmit}>
          <Text style={styles.buttonText}>Submit Report</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => navigation.navigate("ViewReports")}
        >
          <Text style={styles.secondaryButtonText}>View Submitted Reports</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#fff",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  container: {
    padding: 20,
    paddingBottom: 40,
  },
  label: {
    fontWeight: "bold",
    color: "black",
    marginBottom: 6,
    fontSize: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: "black",
    borderRadius: 8,
    padding: 10,
    marginBottom: 16,
    color: "black",
  },
  textarea: {
    height: 120,
    textAlignVertical: "top",
  },
  button: {
    backgroundColor: "#E6F5E6",
    padding: 14,
    borderRadius: 10,
    borderColor: "black",
    borderWidth: 1,
    alignItems: "center",
    marginTop: 4,
  },
  buttonText: {
    color: "black",
    fontWeight: "bold",
    fontSize: 16,
  },
  secondaryButton: {
    marginTop: 12,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "black",
    backgroundColor: "#fff",
    alignItems: "center",
  },
  secondaryButtonText: {
    color: "black",
    fontWeight: "bold",
    fontSize: 16,
  },
});
