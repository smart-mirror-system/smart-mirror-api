const pauseAi = (io) => {
  io.emit('ai:pause');
};

const resumeAi = (io) => {
  io.emit('ai:resume');
};

module.exports = { pauseAi, resumeAi };
