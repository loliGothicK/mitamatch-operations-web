"use client";

import { useEffect, useState } from "react";
import { Joyride, ACTIONS, EVENTS, STATUS, type EventData, type Step } from "react-joyride";
import { useTheme } from "@mui/material/styles";

const STORAGE_KEY = "timeline-builder-tour-completed-v1";

const steps: Step[] = [
  {
    target: '[data-tour="timeline-controls"]',
    content: "共有、カテゴリ絞り込み、課金/無課金の切り替えはここで操作します。",
    skipBeacon: true,
    placement: "bottom",
  },
  {
    target: '[data-tour="timeline-canvas"]',
    content: "左側が現在のタイムラインです。追加したオーダーの順序や時刻をここで確認します。",
    placement: "right",
  },
  {
    target: '[data-tour="timeline-source"]',
    content: "右側のオーダー一覧からタイムラインへ追加します。",
    placement: "left",
  },
];

export function TimelineBuilderTour({ replayKey }: { replayKey: number }) {
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
