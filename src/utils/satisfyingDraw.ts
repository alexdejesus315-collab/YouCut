/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Desenha simulações satisfatórias procedimentais diretamente no Canvas 2D
// para serem usadas no Split Screen sem risco de CORS ou dependência de internet.

export function drawSubwaySurfers(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  time: number
) {
  // Fundo Synthwave Dark
  ctx.fillStyle = "#0c0a0f";
  ctx.fillRect(0, 0, w, h);

  // Grade perspectiva 3D
  const centerY = h * 0.45;
  const horizonY = h * 0.1;
  const numLines = 14;
  
  ctx.strokeStyle = "rgba(139, 92, 246, 0.4)"; // Violeta semitransparente
  ctx.lineWidth = 2;

  // Linhas que convergem ao horizonte (3D)
  for (let i = 0; i <= numLines; i++) {
    const startX = (w / numLines) * i;
    ctx.beginPath();
    ctx.moveTo(startX, h);
    // Converge para o centro horizontal no horizonte
    ctx.lineTo(w / 2 + (startX - w / 2) * 0.05, horizonY);
    ctx.stroke();
  }

  // Linhas horizontais que se movem em direção ao espectador
  const speed = 120; // pixels por segundo
  const spacing = 45;
  const offset = (time * speed) % spacing;

  ctx.strokeStyle = "rgba(236, 72, 153, 0.6)"; // Pink vibrante
  for (
    let currY = horizonY + ((h - horizonY) * 0.05);
    currY < h + spacing;
    currY += spacing
  ) {
    // Escala de profundidade exponencial rápida para parecer 3D real
    const ratio = (currY + offset - horizonY) / (h - horizonY);
    if (ratio < 0 || ratio > 1.2) continue;
    const mappedY = horizonY + (h - horizonY) * Math.pow(ratio, 1.8);

    if (mappedY > horizonY && mappedY < h) {
      ctx.beginPath();
      // Encontra a largura da grade naquele ponto Y
      const widthRatio = 0.05 + (1 - 0.05) * Math.pow(ratio, 1.8);
      const startX = w / 2 - (w / 2) * widthRatio;
      const endX = w / 2 + (w / 2) * widthRatio;
      ctx.moveTo(startX, mappedY);
      ctx.lineTo(endX, mappedY);
      ctx.stroke();
    }
  }

  // Moedas saltitantes (Círculos amarelos em perspectiva)
  const coinCycle = (time * 5) % 3;
  ctx.fillStyle = "#fbbf24"; // Cor Ouro
  ctx.shadowColor = "#f59e0b";
  ctx.shadowBlur = 10;
  
  for (let c = 0; c < 3; c++) {
    const coinProgress = ((coinCycle + c) / 3) % 1;
    const yVal = horizonY + (h - horizonY) * Math.pow(coinProgress, 2);
    const scale = 3 + 20 * coinProgress;
    // Posição numa das 3 pistas (-1, 0, 1)
    const lane = ((Math.floor(time * 0.5) + c) % 3) - 1;
    const laneWidth = (w * 0.35) * Math.pow(coinProgress, 2);
    const xVal = w / 2 + lane * laneWidth;

    if (yVal > horizonY && yVal < h) {
      ctx.beginPath();
      ctx.arc(xVal, yVal - scale, scale, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.shadowBlur = 0; // Desativa shadow logo em seguida

  // Avatar do "Corredor" (Simulador do Subway Surfers)
  // Um pequeno bloco neon estilizado correndo de um lado para o outro
  const characterLane = Math.sin(time * 1.5) > 0.3 ? 1 : Math.sin(time * 1.5) < -0.3 ? -1 : 0;
  const charXTarget = w / 2 + characterLane * (w * 0.28);
  
  // Suavização simples
  const charY = h * 0.82;
  const charWidth = 24;
  const charHeight = 36;

  // Sombra sob o personagem
  ctx.fillStyle = "rgba(0,0,0,0.4)";
  ctx.beginPath();
  ctx.ellipse(charXTarget, charY, charWidth * 0.8, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  // Desenha corredor neon azul berrante saltitando
  const jumpHeight = Math.abs(Math.sin(time * 6.5)) * 14;
  ctx.fillStyle = "#3b82f6";
  ctx.strokeStyle = "#60a5fa";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(
    charXTarget - charWidth / 2,
    charY - charHeight - jumpHeight,
    charWidth,
    charHeight,
    6
  );
  ctx.fill();
  ctx.stroke();

  // Faixa de pontuação na parte de cima
  ctx.fillStyle = "rgba(0,0,0,0.5)";
  ctx.fillRect(10, 10, w - 20, 24);
  
  ctx.font = "bold 11px monospace";
  ctx.fillStyle = "#10b981"; // Verde neon
  ctx.textAlign = "left";
  ctx.fillText("SCORE: " + Math.floor(time * 382), 18, 26);
  
  ctx.fillStyle = "#f59e0b";
  ctx.textAlign = "right";
  ctx.fillText("MULTIPLIER x15", w - 18, 26);
}

// Simulação de sabão sendo cortado satisfatoriamente
interface SoapParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
}
const soapParticles: SoapParticle[] = [];

export function drawSoapCutting(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  time: number
) {
  // Fundo pastel elegante
  ctx.fillStyle = "#f3f4f6";
  ctx.fillRect(0, 0, w, h);

  // Barra de sabão principal
  const soapW = w * 0.6;
  const soapH = h * 0.45;
  const soapX = w / 2 - soapW / 2;
  const soapY = h / 2 - soapH / 2 - 20;

  // Sombras da barra
  ctx.fillStyle = "rgba(0,0,0,0.08)";
  ctx.fillRect(soapX + 10, soapY + soapH, soapW, 12);

  // Corpo do sabão (Várias camadas coloridas estilo arco-íris)
  const colors = ["#ff595e", "#ffca3a", "#8ac926", "#1982c4", "#6a4c93"];
  const layerHeight = soapH / colors.length;

  for (let i = 0; i < colors.length; i++) {
    ctx.fillStyle = colors[i];
    ctx.fillRect(soapX, soapY + i * layerHeight, soapW, layerHeight);

    // Efeito de grade 3D no sabão (blocos prontos para cortar)
    ctx.strokeStyle = "rgba(255,255,255,0.25)";
    ctx.lineWidth = 1.5;
    for (let col = 1; col < 8; col++) {
      const lineX = soapX + (soapW / 8) * col;
      ctx.beginPath();
      ctx.moveTo(lineX, soapY + i * layerHeight);
      ctx.lineTo(lineX, soapY + (i + 1) * layerHeight);
      ctx.stroke();
    }
  }

  // Desenha a faca raspando
  const cutCycle = (time * 1.5) % Math.PI;
  const bladeX = soapX + (soapW * 0.1) + Math.abs(Math.sin(time)) * (soapW * 0.85);
  // A fatia desce verticalmente de cima a baixo
  const bladeY = soapY + (Math.cos(time * 2) * 0.5 + 0.5) * soapH;

  // Gera lascas saltando no ponto de contato da lâmina
  if (Math.floor(time * 50) % 2 === 0) {
    const colIndex = Math.floor(((bladeY - soapY) / soapH) * colors.length);
    const particleColor = colors[Math.min(colIndex, colors.length - 1)] || "#ff595e";
    
    soapParticles.push({
      x: bladeX,
      y: bladeY,
      vx: (Math.random() - 0.5) * 8 - 2, // impulsiona levemente pra esquerda
      vy: -Math.random() * 5 - 3, // joga pra cima
      color: particleColor,
      size: Math.random() * 6 + 4,
      life: 1.0
    });
  }

  // Atualiza e desenha lascas do sabão caindo
  ctx.lineWidth = 1;
  for (let i = soapParticles.length - 1; i >= 0; i--) {
    const p = soapParticles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.45; // gravidade
    p.life -= 0.03;

    if (p.life <= 0 || p.y > h) {
      soapParticles.splice(i, 1);
      continue;
    }

    ctx.fillStyle = p.color;
    ctx.strokeStyle = "rgba(0,0,0,0.15)";
    ctx.beginPath();
    ctx.roundRect(p.x, p.y, p.size, p.size, p.size * 0.2);
    ctx.fill();
    ctx.stroke();
  }

  // Desenha a lâmina da faca metálica cromada
  ctx.shadowColor = "rgba(0,0,0,0.25)";
  ctx.shadowBlur = 8;
  ctx.fillStyle = "#9ca3af"; // Aço cinza
  ctx.strokeStyle = "#e5e7eb";
  ctx.lineWidth = 2;
  
  // Cabo da faca
  ctx.beginPath();
  ctx.roundRect(bladeX - 3, bladeY - soapH * 0.6, 6, soapH * 0.7, 3);
  ctx.fillStyle = "#374151";
  ctx.fill();

  // Lâmina
  ctx.beginPath();
  ctx.moveTo(bladeX - 45, bladeY);
  ctx.lineTo(bladeX + 15, bladeY);
  ctx.lineTo(bladeX + 5, bladeY - 8);
  ctx.lineTo(bladeX - 45, bladeY - 8);
  ctx.closePath();
  ctx.fillStyle = "#d1d5db";
  ctx.fill();
  ctx.stroke();

  ctx.shadowBlur = 0; // Desativa shadows
}

// Simulação de Gelatina/Slime Relaxante
export function drawSlimeFluid(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  time: number
) {
  // Fundo com degradê relaxante
  const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
  bgGrad.addColorStop(0, "#111827");
  bgGrad.addColorStop(1, "#311042");
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, w, h);

  // Desenha múltiplos círculos borrados (Melted metaballs metabubbles)
  const numBubbles = 5;
  const bubbleList = [
    { x: w * 0.3, y: h * 0.4, r: w * 0.22, speed: 0.6, color: "rgba(16, 185, 129, 0.75)" }, // Verde Slime
    { x: w * 0.7, y: h * 0.6, r: w * 0.26, speed: -0.4, color: "rgba(236, 72, 153, 0.75)" }, // Pink Slime
    { x: w * 0.5, y: h * 0.5, r: w * 0.3, speed: 0.2, color: "rgba(99, 102, 241, 0.75)" }, // Roxo Slime
    { x: w * 0.4, y: h * 0.8, r: w * 0.18, speed: 0.8, color: "rgba(245, 158, 11, 0.75)" } // Laranja Slime
  ];

  ctx.save();
  // Filtro de contraste extremo simulado no canvas para fazer as bolhas se fundirem!
  // Como filtros reais podem ser lentos no browser, simulamos desenhando as bolhas
  // com bordas desfocadas e um degradê vibrante sobreposto.
  ctx.globalCompositeOperation = "screen";

  bubbleList.forEach((b, idx) => {
    const shiftX = Math.sin(time * b.speed + idx) * (w * 0.14);
    const shiftY = Math.cos(time * b.speed * 1.2 + idx) * (h * 0.14);
    
    const posX = b.x + shiftX;
    const posY = b.y + shiftY;

    // Gradiente radial para efeito metaball macio
    const radGrad = ctx.createRadialGradient(posX, posY, b.r * 0.1, posX, posY, b.r);
    radGrad.addColorStop(0, b.color);
    radGrad.addColorStop(0.5, b.color.replace("0.75", "0.4"));
    radGrad.addColorStop(1, "rgba(0,0,0,0)");

    ctx.fillStyle = radGrad;
    ctx.beginPath();
    ctx.arc(posX, posY, b.r, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.restore();

  // Pequenas gotículas brilhantes subindo (ASMR Slime bubbles)
  ctx.fillStyle = "rgba(255,255,255,0.45)";
  ctx.shadowColor = "#ffffff";
  ctx.shadowBlur = 5;
  for (let i = 0; i < 7; i++) {
    const bubbleSeed = time * 0.8 + i * 20;
    const dropX = (w * 0.15) + ((i * 1234.567) % (w * 0.7));
    const dropY = h - ((bubbleSeed * 45) % (h + 40));
    const size = 3 + (i % 4);

    if (dropY > 10 && dropY < h) {
      ctx.beginPath();
      ctx.arc(dropX + Math.sin(time + i) * 8, dropY, size, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.shadowBlur = 0;
}
