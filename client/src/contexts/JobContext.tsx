import { createContext, useContext, useReducer, ReactNode } from "react";
import { GoogleSheetsJob, DashboardStats } from "@/types/schema";

interface JobState {
  jobs: GoogleSheetsJob[];
  stats: DashboardStats;
  loading: boolean;
  error: string | null;
  searchQuery: string;
  dateFilter: string;
}

type JobAction = 
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "SET_JOBS"; payload: GoogleSheetsJob[] }
  | { type: "SET_STATS"; payload: DashboardStats }
  | { type: "ADD_JOB"; payload: GoogleSheetsJob }
  | { type: "UPDATE_JOB"; payload: { index: number; job: GoogleSheetsJob } }
  | { type: "DELETE_JOB"; payload: number }
  | { type: "SET_SEARCH_QUERY"; payload: string }
  | { type: "SET_DATE_FILTER"; payload: string };

const initialState: JobState = {
  jobs: [],
  stats: {
    totalJobs: 0,
    totalRevenue: 0,
    totalPartsCost: 0,
    netProfit: 0
  },
  loading: false,
  error: null,
  searchQuery: "",
  dateFilter: "all"
};

function jobReducer(state: JobState, action: JobAction): JobState {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, loading: action.payload };
    case "SET_ERROR":
      return { ...state, error: action.payload };
    case "SET_JOBS":
      return { ...state, jobs: action.payload };
    case "SET_STATS":
      return { ...state, stats: action.payload };
    case "ADD_JOB":
      return { ...state, jobs: [action.payload, ...state.jobs] };
    case "UPDATE_JOB":
      const updatedJobs = [...state.jobs];
      updatedJobs[action.payload.index] = action.payload.job;
      return { ...state, jobs: updatedJobs };
    case "DELETE_JOB":
      return { ...state, jobs: state.jobs.filter((_, index) => index !== action.payload) };
    case "SET_SEARCH_QUERY":
      return { ...state, searchQuery: action.payload };
    case "SET_DATE_FILTER":
      return { ...state, dateFilter: action.payload };
    default:
      return state;
  }
}

const JobContext = createContext<{
  state: JobState;
  dispatch: React.Dispatch<JobAction>;
} | null>(null);

export function JobProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(jobReducer, initialState);

  return (
    <JobContext.Provider value={{ state, dispatch }}>
      {children}
    </JobContext.Provider>
  );
}

export function useJobContext() {
  const context = useContext(JobContext);
  if (!context) {
    throw new Error("useJobContext must be used within a JobProvider");
  }
  return context;
}
