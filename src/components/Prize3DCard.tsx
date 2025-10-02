import React, { useState, useRef, useEffect } from 'react';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';

const TESLA_IMG = 'https://cdn.builder.io/api/v1/image/assets%2F8904b50318464556900ddd5c6ecdfea6%2F127c63234f3742a7abb7557c9c266e86?format=webp&width=800';

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
  const [loading, setLoading] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const load3D = async () => {
    if (Three || loading) return;
    setLoading(true);
    try {
      const [fiber, drei] = await Promise.all([import('@react-three/fiber'), import('@react-three/drei')]);
      if (!mountedRef.current) return;
      if (!fiber || !fiber.Canvas || !drei || !drei.OrbitControls) throw new Error('Missing 3D exports');
      setThree({ Canvas: fiber.Canvas, OrbitControls: drei.OrbitControls });
    } catch (err) {
      console.error('Failed to load 3D modules:', err);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper sx={{ p: 2 }}>
      <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
        {Three && Three.Canvas && !loadError ? (
          (() => {
            const Canvas = (Three as any).Canvas as any;
            const OrbitControls = (Three as any).OrbitControls as any;
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
          <div style={{ textAlign: 'center', width: '100%' }}>
            <img src={TESLA_IMG} alt="Tesla" style={{ width: '100%', height: 180, objectFit: 'cover', borderRadius: 8 }} />
            <div style={{ color: '#FFD700', marginTop: 8 }}>3D preview unavailable</div>
          </div>
        ) : (
          <div style={{ width: '100%' }}>
            <img src={TESLA_IMG} alt="Tesla" style={{ width: '100%', height: 180, objectFit: 'cover', borderRadius: 8 }} />
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 8 }}>
              <Button variant="contained" color="primary" onClick={load3D} disabled={loading} sx={{ textTransform: 'none' }}>
                {loading ? <CircularProgress size={18} color="inherit" /> : 'View 3D'}
              </Button>
            </div>
          </div>
        )}
      </div>

      <Typography variant="subtitle1" sx={{ mt: 1 }}>Tesla Model 3</Typography>
      <Typography variant="caption" color="textSecondary">Spin, zoom, and preview the prize in 3D!</Typography>
    </Paper>
  );
}
