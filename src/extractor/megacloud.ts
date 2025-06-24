import axios from "axios";
import { getSources } from "./megacloud.getsrcs";
import CryptoJS from "crypto-js";

type ExtractedDataTypes = {
  tracks: {
    file: string;
    label: string;
    kind: string;
  }[];
  intro: {
    start: number;
    end: number;
  };
  outro: {
    start: number;
    end: number;
  };
  sources: {
    url: string;
    type: string;
  }[];
};

const megacloud = {
  script: "https://megacloud.tv/js/player/a/prod/e1-player.min.js?v=",
  /* sources: "https://megacloud.tv/embed-1/ajax/e-1/getSources?id=", */
  sources: 'https://videostr.net/embed-1/v2/e-1/getSources?id='
} as const;

export type track = {
  file: string;
  label?: string;
  kind: string;
  default?: boolean;
};

export type unencryptedSrc = {
  file: string;
  type: string;
};

export type extractedSrc = {
  sources: string | unencryptedSrc[];
  tracks: track[];
  _f: number;
  server: number;
};

type ExtractedData = Pick<extractedSrc, "tracks" | "_f" | "server"> & {
  sources: { file: string; type: string }[];
};

export class MegaCloud {
  // https://megacloud.tv/embed-2/e-1/1hnXq7VzX0Ex?k=1
  async extract2(embedIframeURL: URL): Promise<ExtractedData> {
    try {
      const extractedData: ExtractedData = {
        sources: [],
        tracks: [],
        _f: 0,
        server: 0,
      };

      const xrax = embedIframeURL.pathname.split("/").pop() || "";

      const resp = await getSources(xrax);
      if (!resp) return extractedData;

      if (Array.isArray(resp.sources)) {
        extractedData.sources = resp.sources.map((s) => ({
          file: s.file,
          type: s.type,
        }));
      }
      extractedData.tracks = resp.tracks;
      extractedData._f = resp._f;
      extractedData.server = resp.server;


      return extractedData
    } catch (err: any) {
      console.log("Error " + err.message);
      throw new Error(err.message);
    }
  }

  async extract(videoUrl: URL, key: string) {
    try {
      const extractedData: ExtractedData = {
        sources: [],
        tracks: [],
        _f: 0,
        server: 0,
      };

      const videoId = videoUrl?.href?.split("/")?.pop()?.split("?")[0] || "";
      const { data: srcsData } = await axios.get(
        megacloud.sources.concat(videoId) || "",
        {
          headers: {
            Accept: "*/*",
            "X-Requested-With": "XMLHttpRequest",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
            Referer: videoUrl.href,
          },
        }
      );

      if (!srcsData) {
        throw new Error("Url may have an invalid video id");
      }

      const encryptedString = srcsData.sources
      const decrypted = CryptoJS.AES.decrypt(encryptedString, key).toString(CryptoJS.enc.Utf8);
      const parsed = JSON.parse(decrypted);

      extractedData.sources = parsed
      extractedData.tracks = srcsData.tracks
      extractedData.server = srcsData.server
      extractedData._f = srcsData._f

      return extractedData
    } catch (error: any) {
      throw new Error(error.message);
    }
  }
}