import axios from "axios";
import { Request, Response } from "express";
import { MegaCloud } from "../extractor/megacloud";

export const sources = async (req: Request, res: Response) => {
  try {
    const serverId = req.params.serverId

    const [resp, key] = await Promise.all([
      axios.get(`https://movieshdwatch.to/ajax/episode/sources/${serverId}`),
      axios.get('https://keys.hs.vc/')
    ]);
    const link = resp.data.link
    const extractorKey = key.data.rabbitstream.key

    const serverUrl = new URL(link);
    const data = await new MegaCloud().extract(serverUrl, extractorKey);

    res.status(200).json(data);
  } catch (error: any) {
    console.log(error);
    res.status(500).json(error.message);
  }
};