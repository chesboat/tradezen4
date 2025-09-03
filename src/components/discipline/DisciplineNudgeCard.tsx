import React from 'react';

export const DisciplineNudgeCard: React.FC<{ onEnable: () => void }> = ({ onEnable }) => {
  return (
    <div className="p-4 border rounded-xl bg-card">
      <div className="font-medium">Want fewer impulse trades?</div>
      <div className="text-xs text-muted-foreground mt-1">Enable Bullet Counter: set daily bullets; one tap burns a bullet. You can still override.</div>
      <button className="mt-3 px-3 py-2 rounded bg-primary text-primary-foreground text-sm" onClick={onEnable}>Enable</button>
    </div>
  );
};

export default DisciplineNudgeCard;


