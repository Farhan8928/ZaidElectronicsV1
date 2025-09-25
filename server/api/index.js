import express from 'express';
import cors from 'cors';
import { googleSheetsRouter } from '../routes/googleSheets.js';
import { whatsappRouter } from '../routes/whatsapp.js';

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/sheets', googleSheetsRouter);
app.use('/api/whatsapp', whatsappRouter);

export default (req, res) => app(req, res);


