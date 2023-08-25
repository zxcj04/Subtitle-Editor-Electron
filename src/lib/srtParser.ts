import srtParser2 from "srt-parser-2";

const srtParser = new srtParser2();

interface Srt {
  id: string;
  startTime: string;
  startSeconds: number;
  endTime: string;
  endSeconds: number;
  text: string;
}

const toList = (srt: string) => {
  const list: Srt[] = srtParser.fromSrt(srt);
  return list;
};

const toSrt = (list: Srt[]) => {
  const srt = srtParser.toSrt(list);
  return srt;
};

export { toList, toSrt };
