import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { motion } from 'framer-motion';

function TeslaModel3() {
  // Placeholder 3D model: simple spinning box
  return (
    <mesh rotation={[0.4, 0.8, 0]}>
      <boxGeometry args={[2, 1, 4]} />
      <meshStandardMaterial color="#FFD700" metalness={0.8} roughness={0.2} />
    </mesh>
  );
}

export default function Prize3DCard() {
  return (
    <motion.div
      className="glassmorphic rounded-xl p-4 shadow-lg border border-gold flex flex-col items-center justify-center cursor-pointer"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.05, boxShadow: '0 0 32px #FFD700' }}
      transition={{ type: 'spring', stiffness: 300 }}
    >
      <div className="w-full h-48">
        <Suspense fallback={<div className="text-gold">Loading 3D Model...</div>}>
          <Canvas camera={{ position: [0, 2, 8], fov: 50 }}>
            <ambientLight intensity={0.7} />
            <directionalLight position={[5, 10, 5]} intensity={1.2} />
            <TeslaModel3 />
            <OrbitControls enablePan={false} enableZoom={true} />
          </Canvas>
        </Suspense>
      </div>
      <span className="font-bold text-gold text-lg mt-2">Tesla Model 3</span>
      <span className="text-xs text-gray-300 text-center">Spin, zoom, and preview the prize in 3D!</span>
    </motion.div>
  );
}
