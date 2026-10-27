export const validateMiddleware = (schema) => {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      // zod v4 exposes `issues`; `errors` is the zod v3 shape
      const issues = result.error?.issues || result.error?.errors || [];
      const errors = issues.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }));
      return res.status(400).json({ success: false, message: 'Validation failed', errors });
    }
    req.body = result.data;
    next();
  };
};
