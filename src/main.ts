import express, { NextFunction, Request, Response } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

app.use(express.json());

const PORT = 4000;

const posts = [
  {
    username: 'Adam',
    title: 'Post 1',
  },
  {
    username: 'Eve',
    title: 'Post 2',
  },
];

app.post('/login', (req: Request, res: Response) => {
  const username = req.body.username;
  const user = { name: username };

  const accessToken = jwt.sign(user, `${process.env.ACCESS_TOKEN_SECRET}`);
  res.json({ accessToken });
});

const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization']; // header에서 token 가져오기
  const token = authHeader && authHeader.split(' ')[1];
  if (token == null) return res.sendStatus(401);

  jwt.verify(token!, `${process.env.ACCESS_TOKEN_SECRET}`, (err, user) => {
    console.error(err);
    if (err) return res.sendStatus(403);
    req['user'] = user;
    next();
  });
};

app.get('/posts', authMiddleware, (req: Request, res: Response) => {
  res.json(posts);
});

app.listen(PORT, () => {
  console.log(`server running on ${PORT}`);
});
