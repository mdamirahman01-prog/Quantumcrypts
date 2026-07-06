import { useEffect, useRef } from 'react';

export default function CyberBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Grid config
    const gridSize = 40;

    // Nodes and particles config
    const nodeCount = Math.min(60, Math.floor((width * height) / 25000));
    const maxDistance = 120;

    interface Node {
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      glow: number;
      color: string;
    }

    const nodes: Node[] = [];
    const colors = [
      'rgba(6, 182, 212, ',  // Cyan
      'rgba(59, 130, 246, ',  // Blue
      'rgba(16, 185, 129, ',  // Emerald Green
      'rgba(139, 92, 246, ',  // Purple
    ];

    for (let i = 0; i < nodeCount; i++) {
      nodes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        radius: Math.random() * 2 + 1.5,
        glow: Math.random() * 10 + 5,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }

    // Matrix particles
    interface MatrixStream {
      x: number;
      y: number;
      speed: number;
      chars: string[];
      opacity: number;
      color: string;
    }
    const streams: MatrixStream[] = [];
    const streamCount = Math.min(25, Math.floor(width / 60));
    const chars = '01ABCDEFGHIJKLMNOPQRSTUVWXYZ@#$%&*()_+{}[]|;:<>?';

    for (let i = 0; i < streamCount; i++) {
      const streamLen = Math.floor(Math.random() * 8) + 4;
      const streamChars: string[] = [];
      for (let j = 0; j < streamLen; j++) {
        streamChars.push(chars[Math.floor(Math.random() * chars.length)]);
      }
      streams.push({
        x: Math.random() * width,
        y: Math.random() * -height,
        speed: Math.random() * 2 + 1,
        chars: streamChars,
        opacity: Math.random() * 0.12 + 0.03, // Faded so text is highly legible
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;

      // Adjust nodes count dynamically if window resizes heavily
      const targetCount = Math.min(60, Math.floor((width * height) / 25000));
      if (nodes.length < targetCount) {
        while (nodes.length < targetCount) {
          nodes.push({
            x: Math.random() * width,
            y: Math.random() * height,
            vx: (Math.random() - 0.5) * 0.4,
            vy: (Math.random() - 0.5) * 0.4,
            radius: Math.random() * 2 + 1.5,
            glow: Math.random() * 10 + 5,
            color: colors[Math.floor(Math.random() * colors.length)],
          });
        }
      } else if (nodes.length > targetCount) {
        nodes.splice(targetCount);
      }
    };

    window.addEventListener('resize', handleResize);

    // Render loop
    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // 1. Draw subtle grid background
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.025)';
      ctx.lineWidth = 0.5;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // 1b. Smooth horizontal security sweep laser scan
      const scanTime = Date.now() * 0.0008;
      const scanY = ((scanTime * 120) % (height + 200)) - 100;
      if (scanY > 0 && scanY < height) {
        ctx.fillStyle = 'rgba(6, 182, 212, 0.015)';
        ctx.fillRect(0, 0, width, scanY);

        const grad = ctx.createLinearGradient(0, scanY - 6, 0, scanY + 6);
        grad.addColorStop(0, 'rgba(6, 182, 212, 0)');
        grad.addColorStop(0.5, 'rgba(6, 182, 212, 0.1)');
        grad.addColorStop(1, 'rgba(6, 182, 212, 0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, scanY - 6, width, 12);

        // Sweeping beam reflection tip
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.15)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, scanY);
        ctx.lineTo(width, scanY);
        ctx.stroke();
      }

      // 2. Draw Matrix stream letters (ambient, faded)
      ctx.font = '10px monospace';
      streams.forEach((stream) => {
        stream.y += stream.speed;
        if (stream.y > height) {
          stream.y = -50;
          stream.x = Math.random() * width;
        }

        stream.chars.forEach((char, idx) => {
          const charY = stream.y + idx * 12;
          if (charY > 0 && charY < height) {
            // Gradient opacity for trailing stream
            const ratio = idx / stream.chars.length;
            const finalOpacity = stream.opacity * ratio;
            ctx.fillStyle = stream.color + `${finalOpacity})`;
            ctx.fillText(char, stream.x, charY);

            // Occasional character morphing
            if (Math.random() < 0.02) {
              stream.chars[idx] = chars[Math.floor(Math.random() * chars.length)];
            }
          }
        });
      });

      // 3. Update & Draw floating network nodes + lines
      nodes.forEach((node) => {
        node.x += node.vx;
        node.y += node.vy;

        // Bounce walls
        if (node.x < 0 || node.x > width) node.vx *= -1;
        if (node.y < 0 || node.y > height) node.vy *= -1;

        // Draw glowing point
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.fillStyle = node.color + '0.7)';
        ctx.shadowBlur = node.glow;
        ctx.shadowColor = node.color.replace(', ', ')');
        ctx.fill();
        ctx.shadowBlur = 0; // reset
      });

      // Draw connections
      ctx.lineWidth = 0.6;
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < maxDistance) {
            const alpha = (1 - dist / maxDistance) * 0.15;
            // Mixed gradient or first node color
            ctx.strokeStyle = nodes[i].color + `${alpha})`;
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.stroke();
          }
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      id="cyber-nodes-canvas"
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none -z-10 bg-[#020617]"
    />
  );
}
