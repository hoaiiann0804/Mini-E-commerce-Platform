/**
 * Wrapper function để bắt lỗi async/await trong controller
 * Tự động chuyển lỗi tới error handling middleware
 */
const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};

module.exports = {
  catchAsync,
};
