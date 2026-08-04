export class ShapeGenerators {
    static generateScreenSpread(particleCount, camera, posterWidth = 300, posterHeight = 300) {
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        
        // Calculate visible frustum dimensions at camera distance
        const cameraZ = camera.position.z;
        const fov = camera.fov * (Math.PI / 180);
        const aspect = camera.aspect;
        
        const visibleHeight = 2 * Math.tan(fov / 2) * cameraZ;
        const visibleWidth = visibleHeight * aspect;
        
        // Convert poster dimensions from pixels to world space
        // Approximate: 1px ≈ visibleWidth / window.innerWidth in world units
        const posterWorldWidth = (posterWidth / window.innerWidth) * visibleWidth;
        const posterWorldHeight = (posterHeight / window.innerHeight) * visibleHeight;
        
        // Add some padding around the poster
        const avoidWidth = posterWorldWidth * 1.3;
        const avoidHeight = posterWorldHeight * 1.3;
        
        // Depth range for particles (spread them in Z as well)
        const depthRange = visibleHeight * 0.8;
        const minZ = cameraZ - depthRange * 0.5;
        const maxZ = cameraZ + depthRange * 0.5;
        
        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            
            let x, y, z;
            let attempts = 0;
            let inAvoidZone = true;
            const maxAttempts = 100;
            
            // Generate particles across the entire screen, avoiding the poster area
            while (inAvoidZone && attempts < maxAttempts) {
                x = (Math.random() - 0.5) * visibleWidth;
                y = (Math.random() - 0.5) * visibleHeight;
                z = minZ + Math.random() * depthRange;
                
                // Check if particle is in the poster avoidance zone
                inAvoidZone = Math.abs(x) < avoidWidth / 2 && Math.abs(y) < avoidHeight / 2;
                attempts++;
            }
            
            // If we couldn't find a good spot, place it further from center
            if (attempts >= maxAttempts) {
                const angle = Math.random() * Math.PI * 2;
                const dist = Math.max(avoidWidth, avoidHeight) * 0.6 + Math.random() * visibleWidth * 0.2;
                x = Math.cos(angle) * dist;
                y = Math.sin(angle) * dist;
            }
            
            positions[i3] = x;
            positions[i3 + 1] = y;
            positions[i3 + 2] = z;
            
            const brightness = 0.9 + Math.random() * 0.1;
            colors[i3] = brightness;
            colors[i3 + 1] = brightness;
            colors[i3 + 2] = brightness;
        }
        
        return { positions, colors };
    }
    
    static generateNebula(particleCount, radius) {
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        const centerAvoidRadius = 8;
        
        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            
            let x, y, z, dist;
            let attempts = 0;
            
            do {
                const theta = Math.random() * Math.PI * 2;
                const phi = Math.acos(2 * Math.random() - 1);
                const r = Math.random() * radius;
                
                x = r * Math.sin(phi) * Math.cos(theta);
                y = r * Math.sin(phi) * Math.sin(theta);
                z = r * Math.cos(phi);
                
                dist = Math.sqrt(x * x + y * y);
                attempts++;
            } while (dist < centerAvoidRadius && attempts < 50);
            
            positions[i3] = x;
            positions[i3 + 1] = y;
            positions[i3 + 2] = z;
            
            const brightness = 0.9 + Math.random() * 0.1;
            colors[i3] = brightness;
            colors[i3 + 1] = brightness;
            colors[i3 + 2] = brightness;
        }
        
        return { positions, colors };
    }
    
    static generateGrid(particleCount, size = 25) {
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        const centerAvoidRadius = 8;
        
        const gridSize = Math.ceil(Math.cbrt(particleCount));
        const spacing = (size * 2) / gridSize;
        const offset = -size;
        
        let index = 0;
        for (let x = 0; x < gridSize && index < particleCount; x++) {
            for (let y = 0; y < gridSize && index < particleCount; y++) {
                for (let z = 0; z < gridSize && index < particleCount; z++) {
                    if (index >= particleCount) break;
                    
                    const i3 = index * 3;
                    const px = offset + x * spacing + (Math.random() - 0.5) * spacing * 0.3;
                    const py = offset + y * spacing + (Math.random() - 0.5) * spacing * 0.3;
                    const pz = offset + z * spacing + (Math.random() - 0.5) * spacing * 0.3;
                    
                    const dist = Math.sqrt(px * px + py * py);
                    if (dist < centerAvoidRadius) {
                        const angle = Math.atan2(py, px);
                        const newDist = centerAvoidRadius + Math.random() * 2;
                        positions[i3] = Math.cos(angle) * newDist;
                        positions[i3 + 1] = Math.sin(angle) * newDist;
                    } else {
                        positions[i3] = px;
                        positions[i3 + 1] = py;
                    }
                    positions[i3 + 2] = pz;
                    
                    const brightness = 0.9 + Math.random() * 0.1;
                    colors[i3] = brightness;
                    colors[i3 + 1] = brightness;
                    colors[i3 + 2] = brightness;
                    
                    index++;
                }
            }
        }
        
        while (index < particleCount) {
            const i3 = index * 3;
            let px, py, dist;
            do {
                px = (Math.random() - 0.5) * size * 2;
                py = (Math.random() - 0.5) * size * 2;
                dist = Math.sqrt(px * px + py * py);
            } while (dist < centerAvoidRadius);
            
            positions[i3] = px;
            positions[i3 + 1] = py;
            positions[i3 + 2] = (Math.random() - 0.5) * size * 2;
            
            const brightness = 0.9 + Math.random() * 0.1;
            colors[i3] = brightness;
            colors[i3 + 1] = brightness;
            colors[i3 + 2] = brightness;
            
            index++;
        }
        
        return { positions, colors };
    }
    
    static generateTerrain(particleCount, size = 25) {
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        const centerAvoidRadius = 8;
        
        const gridRes = Math.ceil(Math.sqrt(particleCount));
        const spacing = (size * 2) / gridRes;
        const offset = -size;
        
        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            
            let x = (i % gridRes) * spacing + offset;
            let z = Math.floor(i / gridRes) * spacing + offset;
            
            const dist = Math.sqrt(x * x + z * z);
            if (dist < centerAvoidRadius) {
                const angle = Math.atan2(z, x);
                const newDist = centerAvoidRadius + Math.random() * 2;
                x = Math.cos(angle) * newDist;
                z = Math.sin(angle) * newDist;
            }
            
            const noise = Math.sin(x * 0.3) * Math.cos(z * 0.3) * 8;
            const height = noise + Math.random() * 3 - 1.5;
            
            positions[i3] = x + (Math.random() - 0.5) * spacing * 0.5;
            positions[i3 + 1] = height;
            positions[i3 + 2] = z + (Math.random() - 0.5) * spacing * 0.5;
            
            const brightness = 0.9 + Math.random() * 0.1;
            colors[i3] = brightness;
            colors[i3 + 1] = brightness;
            colors[i3 + 2] = brightness;
        }
        
        return { positions, colors };
    }
}
