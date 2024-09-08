const asyncHandlerFunction = (requestFunction) => {
    return async (req, res, next) => {
      try {
        await requestFunction(req, res, next);
      } catch (err) {
        const statusCode = err.code >= 100 && err.code < 600 ? err.code : 500;
        return res.status(statusCode).json({
          success: false,
          message: err.message || 'Internal Server Error',
        });
      }
    };
  };



  
  export default asyncHandlerFunction;
  