import { useEffect, useState } from 'react';
import './index.less';

const FlowerEffect = ({ active, onComplete }) => {
  const [flowers, setFlowers] = useState([]);
  const [explosionCenters, setExplosionCenters] = useState([]);

  useEffect(() => {
    if (active) {
      createFlowers();
    }
  }, [active]);

  const createFlowers = () => {
    const newFlowers = [];
    const flowerCount = 100; // 烟花元素数量

    // 烟花的颜色数组 - 鲜艳的烟花色彩
    const colors = [
      '#FF0040',
      '#FF4000',
      '#FF8000',
      '#FFFF00',
      '#80FF00',
      '#00FF00',
      '#00FF80',
      '#00FFFF',
      '#0080FF',
      '#0000FF',
      '#8000FF',
      '#FF00FF',
      '#FF0080',
      '#FFD700',
      '#FF6347',
      '#FF69B4',
      '#FF1493',
      '#DC143C',
      '#FFA500',
      '#ADFF2F',
    ];

    // 纯烟花元素 - 只显示烟花粒子，不显示爆炸符号
    const shapes = [
      '✨',
      '⭐',
      '🌟',
      '💫',
      '💎',
      '🔸',
      '🔹',
      '💠',
      '🌠',
      '🌸',
      '🌺',
      '🌻',
      '🌷',
      '🌹',
      '🏵️',
      '🌼',
      '🎊',
    ];

    // 创建爆炸点（在屏幕中上部）
    const explosionPoints = [];
    const explosionCount = Math.floor(Math.random() * 2) + 2; // 2-3个爆炸点

    for (let i = 0; i < explosionCount; i++) {
      explosionPoints.push({
        id: i,
        x: Math.random() * (window.innerWidth - 400) + 200, // 避免太靠边
        y: Math.random() * 200 + 150, // 屏幕上方150-350px处爆炸
      });
    }

    // 保存爆炸中心点用于显示闪光效果
    setExplosionCenters(explosionPoints);

    for (let i = 0; i < flowerCount; i++) {
      // 随机选择一个爆炸点
      const explosionPoint =
        explosionPoints[Math.floor(Math.random() * explosionPoints.length)];

      // 简单的360度散射
      const angle = Math.random() * 2 * Math.PI; // 360度随机方向
      const distance = Math.random() * 400 + 150; // 150-550px的散射距离

      // 计算散射后的位置
      const scatterX = explosionPoint.x + Math.cos(angle) * distance;
      const scatterY = explosionPoint.y + Math.sin(angle) * distance;

      // 自由落体的最终位置
      const fallX = scatterX + (Math.random() - 0.5) * 200; // 水平偏移
      const fallY = window.innerHeight + 50; // 落到屏幕底部

      const flower = {
        id: i,
        // 爆炸中心点
        explosionX: explosionPoint.x,
        explosionY: explosionPoint.y,
        // 散射后的位置
        scatterX: scatterX,
        scatterY: scatterY,
        // 最终落地位置
        fallX: fallX,
        fallY: fallY,
        // 样式属性
        color: colors[Math.floor(Math.random() * colors.length)],
        shape: shapes[Math.floor(Math.random() * shapes.length)],
        size: Math.random() * 18 + 12, // 12-30px
        // 时间属性
        scatterDuration: 0.3, // 散射阶段：0.3秒
        fallDuration: Math.random() * 2 + 3, // 自由落体阶段：3-5秒
        delay: Math.random() * 100, // 0-100ms延迟
        // 动画属性
        rotationSpeed: (Math.random() - 0.5) * 720, // 旋转速度
      };
      newFlowers.push(flower);
    }

    setFlowers(newFlowers);

    // 动画完成后清理 - 散射0.3秒 + 自由落体最长5秒 + 缓冲0.5秒
    setTimeout(() => {
      setFlowers([]);
      setExplosionCenters([]);
      if (onComplete) {
        onComplete();
      }
    }, 6000);
  };

  if (!active && flowers.length === 0) {
    return null;
  }

  return (
    <div className="flower-effect-container">
      {/* 爆炸中心点闪光效果 */}
      {explosionCenters.map((center) => (
        <div
          key={`center-${center.id}`}
          className="explosion-center"
          style={{
            left: `${center.x}px`,
            top: `${center.y}px`,
          }}
        >
          ✨
        </div>
      ))}

      {/* 烟花元素 */}
      {flowers.map((flower) => (
        <div
          key={flower.id}
          className="flower-item simple-firework"
          style={{
            left: `${flower.explosionX}px`,
            top: `${flower.explosionY}px`,
            fontSize: `${flower.size}px`,
            color: flower.color,
            animationDelay: `${flower.delay}ms`,
            // 散射位置
            '--scatter-x': `${flower.scatterX - flower.explosionX}px`,
            '--scatter-y': `${flower.scatterY - flower.explosionY}px`,
            // 最终落地位置
            '--fall-x': `${flower.fallX - flower.explosionX}px`,
            '--fall-y': `${flower.fallY - flower.explosionY}px`,
            // 时间参数
            '--scatter-duration': `${flower.scatterDuration}s`,
            '--fall-duration': `${flower.fallDuration}s`,
            '--rotation-speed': `${flower.rotationSpeed}deg`,
          }}
        >
          {flower.shape}
        </div>
      ))}
    </div>
  );
};

export default FlowerEffect;
