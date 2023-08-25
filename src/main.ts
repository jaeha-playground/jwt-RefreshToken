import express, { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

app.use(express.json());
app.use(cookieParser());

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

let refreshTokens: string[] = [];

app.get('/', (req: Request, res: Response) => {
  res.send('hi');
});

app.post('/login', (req: Request, res: Response) => {
  const username = req.body.username;
  const user = { name: username };

  const accessToken = jwt.sign(user, `${process.env.ACCESS_TOKEN_SECRET}`, { expiresIn: '30s' });

  const refreshToken = jwt.sign(user, `${process.env.REFRESH_TOKEN_SECRET}`, { expiresIn: '1d' });
  refreshTokens.push(refreshToken);

  // client 쿠키에 보관
  res.cookie('jwt', refreshToken, {
    httpOnly: true,
    maxAge: 24 * 60 * 1000,
  });

  res.json({ accessToken });
});

// refresh token으로 access token 새로 생성
app.get('/refresh', (req: Request, res: Response) => {
  const cookies = req.cookies;
  console.log('cookies>>>', cookies);

  if (!cookies?.jwt) return res.sendStatus(401);

  const refreshToken = cookies.jwt;
  // DB에 refreshToken이 있는지 확인
  if (!refreshTokens.includes(refreshToken)) return res.sendStatus(403);

  // token 유효한지 검증
  jwt.verify(refreshToken, `${process.env.REFRESH_TOKEN_SECRET}`, (err: any, user: any) => {
    if (err) return res.sendStatus(403);

    const accessToken = jwt.sign({ name: user?.name }, `${process.env.ACCESS_TOKEN_SECRET}`, { expiresIn: '30s' });

    res.json({ accessToken });
  });
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
