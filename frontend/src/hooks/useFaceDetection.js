import { useEffect, useRef, useState, useCallback } from 'react';
import * as faceapi from 'face-api.js';
import API from '../utils/api';

const MODEL_URL = '/models';

export const useFaceDetection = () => {
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const labeledDescriptors = useRef([]);
  const matcherRef = useRef(null);

  // Load face-api models
  useEffect(() => {
    const loadModels = async () => {
      try {
        setLoading(true);
        await Promise.all([
          faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        ]);
        setModelsLoaded(true);
        console.log('✅ Face-API models loaded');
      } catch (err) {
        setError('Failed to load face detection models. Check /public/models folder.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadModels();
  }, []);

  // Load member face descriptors from server
  const loadFaceDescriptors = useCallback(async () => {
    try {
      const { data } = await API.get('/members/faces');
      const labeled = data.data
        .filter(m => m.FaceDescriptor)
        .map(member => {
          try {
            const descriptorData = JSON.parse(member.FaceDescriptor);
            const descriptors = Array.isArray(descriptorData[0])
              ? descriptorData.map(d => new Float32Array(d))
              : [new Float32Array(descriptorData)];
            return new faceapi.LabeledFaceDescriptors(
              String(member.MemberID),
              descriptors
            );
          } catch {
            return null;
          }
        })
        .filter(Boolean);

      labeledDescriptors.current = labeled;
      if (labeled.length > 0) {
        matcherRef.current = new faceapi.FaceMatcher(labeled, 0.55);
      }
      return labeled.length;
    } catch (err) {
      console.error('Failed to load face descriptors:', err);
      return 0;
    }
  }, []);

  // Detect and recognize a face from a video element
  const detectFace = useCallback(async (videoEl) => {
    if (!modelsLoaded || !videoEl) return null;

    const detection = await faceapi
      .detectSingleFace(videoEl, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (!detection) return { found: false };

    if (!matcherRef.current) return { found: true, descriptor: detection.descriptor, memberId: null };

    const match = matcherRef.current.findBestMatch(detection.descriptor);
    const isUnknown = match.label === 'unknown';

    return {
      found: true,
      descriptor: detection.descriptor,
      memberId: isUnknown ? null : parseInt(match.label),
      distance: match.distance,
      confidence: Math.round((1 - match.distance) * 100),
      isUnknown,
    };
  }, [modelsLoaded]);

  // Extract descriptor from image/video for enrollment
  const extractDescriptor = useCallback(async (imageEl) => {
    if (!modelsLoaded) throw new Error('Models not loaded');

    const detection = await faceapi
      .detectSingleFace(imageEl, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (!detection) throw new Error('No face detected in image');

    return Array.from(detection.descriptor);
  }, [modelsLoaded]);

  return {
    modelsLoaded,
    loading,
    error,
    loadFaceDescriptors,
    detectFace,
    extractDescriptor,
    memberCount: labeledDescriptors.current.length,
  };
};
