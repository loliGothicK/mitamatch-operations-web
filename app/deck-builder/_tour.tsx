"use client";

import { useEffect, useState } from "react";
import { Joyride, ACTIONS, EVENTS, STATUS, type EventData, type Step } from "react-joyride";
import { useTheme } from "@mui/material/styles";

const STORAGE_KEY = "deck-builder-tour-completed-v1";

const steps: Step[] = [
  {
    target: '[data-tour="deck-tabs"]',
    content: "Builder と Calculator をここで切り替えます。",
    skipBeacon: true,
    placement: "bottom",
  },
  {
    target: '[data-tour="deck-toolbar"]',
    content: (
      <div>
        <p>デッキ操作、共有、比較、絞り込み、検索、ソートはこのツールバーから行います。</p>
        <p style={{ marginTop: "0.5em", fontSize: "0.9em" }}>
          絞り込み・検索時のクエリについては{" "}
          <a
            href="/data/query-beginner-guide"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "inherit", textDecoration: "underline", cursor: "pointer" }}
          >
            クエリの書き方ガイド
          </a>
          を参照してください。
        </p>
      </div>
    ) as any,
    placement: "bottom",
  },
  {
    target: '[data-tour="deck-details"]',
    content: "左側では現在のユニット情報やスキル詳細を確認できます。",
    placement: "right",
  },
  {
    target: '[data-tour="deck-unit"]',
    content: "中央が現在のデッキです。追加したメモリアの並びや構成をここで確認します。",
    placement: "left",
  },
  {
    target: '[data-tour="deck-source"]',
    content:
      "右側の候補一覧からメモリアを追加します。Filter や Search の結果もここに反映されます。",
    placement: "left",
  },
];

export function DeckBuilderTour({ replayKey }: { replayKey: number }) {
  const theme = useTheme();
  const [run, setRun] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    const completed = window.localStorage.getItem(STORAGE_KEY);
    if (completed !== "true") {
      setStepIndex(0);
      setRun(true);
      window.localStorage.setItem(STORAGE_KEY, "true");
    }
  }, []);

  useEffect(() => {
    if (replayKey === 0) {
      return;
    }
    setStepIndex(0);
    setRun(true);
  }, [replayKey]);

  const handleEvent = (data: EventData) => {
    const { action, index, status, type } = data;

    if (type === EVENTS.TARGET_NOT_FOUND) {
      setStepIndex((prev) => prev + 1);
      return;
    }

    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      setRun(false);
      setStepIndex(0);
      return;
    }

    if (type === EVENTS.STEP_AFTER) {
      setStepIndex(index + (action === ACTIONS.PREV ? -1 : 1));
    }
  };

  return (
    <Joyride
      run={run}
      stepIndex={stepIndex}
      steps={steps}
      continuous={true}
      locale={{
        back: "戻る",
        close: "閉じる",
        last: "完了",
        next: "次へ",
        nextWithProgress: "次へ ({current}/{total})",
        skip: "スキップ",
      }}
      options={{
        zIndex: theme.zIndex.modal + 10,
        primaryColor: theme.palette.primary.main,
        backgroundColor: theme.palette.background.paper,
        textColor: theme.palette.text.primary,
        overlayColor: "rgba(0, 0, 0, 0.5)",
        scrollOffset: 80,
        showProgress: true,
      }}
      styles={{
        tooltip: {
          borderRadius: 12,
        },
      }}
      onEvent={handleEvent}
    />
  );
}
