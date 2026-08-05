"use client";

import React, { createContext, useContext, useEffect, useMemo, useReducer } from "react";
import { syncBadges } from "./badges";
import { deletePhoto } from "./photos";
import { initialState } from "./seed";
import { loadState, saveState } from "./storage";
import type {
  AppSettings,
  AppState,
  BadgeAward,
  BodyRecord,
  Cheer,
  Member,
  MemberId,
  Program,
  WorkoutLog,
} from "./types";

interface StoreState {
  data: AppState;
  pendingBadges: BadgeAward[];
  loaded: boolean;
}

type Action =
  | { type: "HYDRATE"; payload: AppState }
  | { type: "SELECT_MEMBER"; id: MemberId }
  | { type: "UPDATE_MEMBER"; member: Member }
  | { type: "UPSERT_LOG"; log: WorkoutLog }
  | { type: "DELETE_LOG"; id: string }
  | { type: "UPSERT_PROGRAM"; program: Program }
  | { type: "DELETE_PROGRAM"; id: string }
  | { type: "UPSERT_BODY"; record: BodyRecord }
  | { type: "DELETE_BODY"; id: string }
  | { type: "ADD_CHEER"; cheer: Cheer }
  | { type: "UPDATE_SETTINGS"; settings: Partial<AppSettings> }
  | { type: "REPLACE_ALL"; payload: AppState }
  | { type: "CLEAR_PENDING" }
  | { type: "RESET" };

/** 상태 변경 후 관련 멤버들의 배지를 재평가한다. */
function withBadges(data: AppState, memberIds: MemberId[]): { data: AppState; newly: BadgeAward[] } {
  let next = data;
  const allNew: BadgeAward[] = [];
  for (const id of memberIds) {
    const { badges, newly } = syncBadges(next, id);
    next = { ...next, badges };
    allNew.push(...newly);
  }
  return { data: next, newly: allNew };
}

function reducer(state: StoreState, action: Action): StoreState {
  const d = state.data;
  switch (action.type) {
    case "HYDRATE":
      return { data: action.payload, pendingBadges: [], loaded: true };

    case "SELECT_MEMBER":
      return { ...state, data: { ...d, currentMemberId: action.id } };

    case "UPDATE_MEMBER":
      return {
        ...state,
        data: { ...d, members: d.members.map((m) => (m.id === action.member.id ? action.member : m)) },
      };

    case "UPSERT_LOG": {
      const exists = d.logs.some((l) => l.id === action.log.id);
      const logs = exists
        ? d.logs.map((l) => (l.id === action.log.id ? action.log : l))
        : [...d.logs, action.log];
      // 가족 배지(family-day 등)를 위해 전원 재평가
      const { data, newly } = withBadges({ ...d, logs }, d.members.map((m) => m.id));
      return { ...state, data, pendingBadges: [...state.pendingBadges, ...newly] };
    }

    case "DELETE_LOG": {
      const logs = d.logs.filter((l) => l.id !== action.id);
      return { ...state, data: { ...d, logs } };
    }

    case "UPSERT_PROGRAM": {
      const exists = d.programs.some((p) => p.id === action.program.id);
      const programs = exists
        ? d.programs.map((p) => (p.id === action.program.id ? action.program : p))
        : [...d.programs, action.program];
      const { data, newly } = withBadges({ ...d, programs }, [action.program.memberId]);
      return { ...state, data, pendingBadges: [...state.pendingBadges, ...newly] };
    }

    case "DELETE_PROGRAM":
      return {
        ...state,
        data: {
          ...d,
          programs: d.programs.filter((p) => p.id !== action.id),
          logs: d.logs.map((l) => (l.programId === action.id ? { ...l, programId: undefined } : l)),
        },
      };

    case "UPSERT_BODY": {
      const exists = d.bodyRecords.some((b) => b.id === action.record.id);
      const bodyRecords = exists
        ? d.bodyRecords.map((b) => (b.id === action.record.id ? action.record : b))
        : [...d.bodyRecords, action.record];
      const { data, newly } = withBadges({ ...d, bodyRecords }, [action.record.memberId]);
      return { ...state, data, pendingBadges: [...state.pendingBadges, ...newly] };
    }

    case "DELETE_BODY":
      return { ...state, data: { ...d, bodyRecords: d.bodyRecords.filter((b) => b.id !== action.id) } };

    case "ADD_CHEER": {
      const cheers = [...d.cheers, action.cheer];
      const { data, newly } = withBadges({ ...d, cheers }, [action.cheer.fromId, action.cheer.toId]);
      return { ...state, data, pendingBadges: [...state.pendingBadges, ...newly] };
    }

    case "UPDATE_SETTINGS":
      return { ...state, data: { ...d, settings: { ...d.settings, ...action.settings } } };

    case "REPLACE_ALL":
      return { ...state, data: action.payload };

    case "CLEAR_PENDING":
      return { ...state, pendingBadges: [] };

    case "RESET":
      return { data: initialState(), pendingBadges: [], loaded: true };

    default:
      return state;
  }
}

interface StoreValue {
  state: AppState;
  loaded: boolean;
  pendingBadges: BadgeAward[];
  currentMember: Member | null;
  dispatch: React.Dispatch<Action>;
  /** 로그 삭제 시 사진도 함께 정리 */
  removeLog: (id: string) => void;
  removeBody: (id: string) => void;
}

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, {
    data: initialState(),
    pendingBadges: [],
    loaded: false,
  });

  useEffect(() => {
    dispatch({ type: "HYDRATE", payload: loadState() });
  }, []);

  useEffect(() => {
    if (state.loaded) saveState(state.data);
  }, [state.data, state.loaded]);

  const value = useMemo<StoreValue>(() => {
    const currentMember =
      state.data.members.find((m) => m.id === state.data.currentMemberId) ?? null;

    return {
      state: state.data,
      loaded: state.loaded,
      pendingBadges: state.pendingBadges,
      currentMember,
      dispatch,
      removeLog: (id: string) => {
        const log = state.data.logs.find((l) => l.id === id);
        log?.photoIds.forEach((p) => void deletePhoto(p));
        dispatch({ type: "DELETE_LOG", id });
      },
      removeBody: (id: string) => {
        const rec = state.data.bodyRecords.find((b) => b.id === id);
        rec?.photoIds.forEach((p) => void deletePhoto(p));
        dispatch({ type: "DELETE_BODY", id });
      },
    };
  }, [state]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore는 StoreProvider 안에서만 사용할 수 있습니다.");
  return ctx;
}
