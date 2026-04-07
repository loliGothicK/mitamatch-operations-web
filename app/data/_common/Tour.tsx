"use client";

import { useEffect, useMemo, useState } from "react";
import { Joyride, ACTIONS, EVENTS, STATUS, type EventData, type Step } from "react-joyride";
import { useTheme } from "@mui/material/styles";

const STORAGE_KEY = "data-pages-tour-completed-v1";

const gridSteps: Step[] = [
  {
    target: '[data-tour="data-tabs"]',
    content: "タブを切り替えて、メモリア・衣装・キャラクターの各データページへ移動できます。",
    skipBeacon: true,
    placement: "bottom",
  },
  {
    target: '[data-tour="data-breadcrumbs"]',
    content: "現在見ている data ページの位置をここで確認できます。",
    placement: "bottom-start",
  },
  {
    target: '[data-tour="data-grid-toolbar"]',
    content: "ここからクエリ実行、クエリ初期化、共有、表示切り替え、ヘルプ表示を行います。",
    placement: "bottom-start",
  },
  {
    target: '[data-tour="data-query-editor"]',
    content: "GoogleSQL ライクなクエリを入力して、一覧を絞り込みできます。",
    placement: "bottom",
  },
  {
    target: '[data-tour="data-grid"]',
    content: "絞り込み結果はこの Data Grid に表示されます。画像から詳細ページにも移動できます。",
    placement: "top",
  },
];

export function DataPageTour({
  tab,
  replayKey,
}: {
  tab: "memoria" | "costume" | "character";
  replayKey: number;
}) {
  const theme = useTheme();
  const [run, setRun] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  const steps = useMemo(() => gridSteps, []);

  useEffect(() => {
    if (tab === "character") {
      setRun(false);
      setStepIndex(0);
      return;
    }
    const completed = window.localStorage.getItem(STORAGE_KEY);
    if (completed !== "true") {
      setStepIndex(0);
      setRun(true);
      window.localStorage.setItem(STORAGE_KEY, "true");
    }
  }, [tab]);

  useEffect(() => {
    if (tab === "character") {
      setRun(false);
      setStepIndex(0);
      return;
    }
    if (replayKey === 0) {
      return;
    }
    setStepIndex(0);
    setRun(true);
  }, [replayKey, tab]);

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
        buttonClose: {
          color: theme.palette.text.secondary,
        },
      }}
      onEvent={handleEvent}
    />
  );
}
