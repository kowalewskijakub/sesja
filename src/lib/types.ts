export interface RankedQuestion {
  id: number;
  text: string;
  count: number;
}

export interface AdminQuestion extends RankedQuestion {
  hidden: boolean;
}
