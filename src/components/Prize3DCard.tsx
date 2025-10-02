import React, { useEffect, useState } from 'react';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';

function TeslaModel3() {
  return (
    <mesh rotation={[0.4, 0.8, 0]}>
      <boxGeometry args={[2, 1, 4]} />
      <meshStandardMaterial color="#FFD700" metalness={0.8} roughness={0.2} />
    </mesh>
  );
}

export default function Prize3DCard() {
  const [Three, setThree] = useState<{ Canvas?: any; OrbitControls?: any } | null>(null);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let mounted = true;

    Promise.all([import('@react-three/fiber'), import('@react-three/drei')])
      .then(([fiber, drei]) => {
        if (!mounted) return;
        setThree({ Canvas: fiber.Canvas, OrbitControls: drei.OrbitControls });
      })
      .catch((err) => {
        console.error('Failed to load 3D modules:', err);
        if (mounted) setLoadError(true);
      });

    return () => { mounted = false; };
  }, []);

  return (
    <Paper sx={{ p: 2 }}>
      <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {Three && Three.Canvas && !loadError ? (
          (() => {
            const Canvas = Three.Canvas as any;
            const OrbitControls = Three.OrbitControls as any;

            return (
              <Canvas camera={{ position: [0, 2, 8], fov: 50 }} style={{ height: '100%', width: '100%' }}>
                <ambientLight intensity={0.7} />
                <directionalLight position={[5, 10, 5]} intensity={1.2} />
                <TeslaModel3 />
                <OrbitControls enablePan={false} enableZoom={true} />
              </Canvas>
            );
          })()
        ) : loadError ? (
          <div style={{ color: '#FFD700' }}>3D preview unavailable</div>
        ) : (
          <div style={{ color: '#FFD700' }}>Loading 3D...</div>
        )}
      </div>
      <Typography variant="subtitle1" sx={{ mt: 1 }}>Tesla Model 3</Typography>
      <Typography variant="caption" color="textSecondary">Spin, zoom, and preview the prize in 3D!</Typography>
    </Paper>
  );
}
