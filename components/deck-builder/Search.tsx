import TabContext from '@mui/lab/TabContext';
import TabList from '@mui/lab/TabList';
import TabPanel from '@mui/lab/TabPanel';
import { Button } from '@mui/material';
import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import { useAtom } from 'jotai';

import { CheckBoxItem } from '@/components/deck-builder/CheckBoxItem';
import {
  intoStatusPattern,
  statusPatternToJapanese,
  supportPatternToJapanese,
} from '@/components/deck-builder/Details';
import {
  assistSupportFilterAtom,
  basicStatusFilterAtom,
  elementStatusFilterAtom,
  labelFilterAtom,
  otherSkillFilterAtom,
  otherSupportFilterAtom,
  recoverySupportFilterAtom,
  resetFilterAtom,
  vanguardSupportFilterAtom,
} from '@/jotai/memoriaAtoms';
import {
  allAssistSupportSearch,
  allBasicStatusSearch,
  allElementStatusSearch,
  allOtherSkillSearch,
  allRecoverySupportSearch,
  allVanguardSupportSearch,
  elementalSkillPatternToJapanese,
  intoElementalSkillPattern,
  labelSearch,
  otherSupportSearch,
} from '@/types/searchType';
import { type SyntheticEvent, useState } from 'react';

function LabelCheckbox() {
  const [filter, setFilter] = useAtom(labelFilterAtom);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', ml: 3 }}>
      {labelSearch.map(flag => {
        return (
          <CheckBoxItem
            key={flag}
            name={flag}
            checked={filter.includes(flag)}
            handleChange={() => {
              setFilter(prev => {
                if (filter.includes(flag)) {
                  return prev.filter(v => v !== flag);
                }
                return [...prev, flag];
              });
            }}
          />
        );
      })}
    </Box>
  );
}

function BasicStatusCheckbox() {
  const [filter, setFilter] = useAtom(basicStatusFilterAtom);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', ml: 3 }}>
      {allBasicStatusSearch().map(flag => {
        return (
          <CheckBoxItem
            key={intoStatusPattern(flag)}
            name={statusPatternToJapanese(intoStatusPattern(flag))}
            checked={filter.some(
              v => v.status === flag.status && v.upDown === flag.upDown,
            )}
            handleChange={() => {
              setFilter(prev => {
                if (
                  filter.some(
                    v => v.status === flag.status && v.upDown === flag.upDown,
                  )
                ) {
                  return prev.filter(
                    v => v.status !== flag.status || v.upDown !== flag.upDown,
                  );
                }
                return [...prev, flag];
              });
            }}
          />
        );
      })}
    </Box>
  );
}

function ElementStatusCheckbox() {
  const [filter, setFilter] = useAtom(elementStatusFilterAtom);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', ml: 3 }}>
      {allElementStatusSearch().map(flag => {
        return (
          <CheckBoxItem
            key={intoStatusPattern(flag)}
            name={statusPatternToJapanese(intoStatusPattern(flag))}
            checked={filter.some(
              v => v.status === flag.status && v.upDown === flag.upDown,
            )}
            handleChange={() => {
              setFilter(prev => {
                if (
                  filter.some(
                    v => v.status === flag.status && v.upDown === flag.upDown,
                  )
                ) {
                  return prev.filter(
                    v => v.status !== flag.status || v.upDown !== flag.upDown,
                  );
                }
                return [...prev, flag];
              });
            }}
          />
        );
      })}
    </Box>
  );
}

function OtherSkillCheckbox() {
  const [filter, setFilter] = useAtom(otherSkillFilterAtom);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', ml: 3 }}>
      {allOtherSkillSearch().map(flag => {
        if (typeof flag === 'string') {
          return (
            <CheckBoxItem
              key={flag}
              name={
                flag === 'charge'
                  ? 'チャージ'
                  : flag === 'counter'
                    ? 'カウンター'
                    : flag === 'heal'
                      ? 'ヒール'
                      : flag === 'Meteor'
                        ? 'メテオ'
                        : flag === 'Eden'
                          ? 'エデン'
                          : flag === 'Barrier'
                            ? 'バリア'
                            : flag === 'ANiMA'
                              ? 'アニマ'
                              : '???'
              }
              checked={filter.includes(flag)}
              handleChange={() => {
                setFilter(prev => {
                  if (filter.includes(flag)) {
                    return prev.filter(v => v !== flag);
                  }
                  return [...prev, flag];
                });
              }}
            />
          );
        }
        return (
          <CheckBoxItem
            key={intoElementalSkillPattern(flag)}
            name={elementalSkillPatternToJapanese(
              intoElementalSkillPattern(flag),
            )}
            checked={filter.some(
              v =>
                typeof v !== 'string' &&
                v.element === flag.element &&
                v.kind === flag.kind,
            )}
            handleChange={() => {
              setFilter(prev => {
                if (
                  filter.some(
                    v =>
                      typeof v !== 'string' &&
                      v.element === flag.element &&
                      v.kind === flag.kind,
                  )
                ) {
                  return prev.filter(
                    v =>
                      typeof v !== 'string' &&
                      (v.element !== flag.element || v.kind !== flag.kind),
                  );
                }
                return [...prev, flag];
              });
            }}
          />
        );
      })}
    </Box>
  );
}

export function VanguardSupportCheckbox() {
  const [filter, setFilter] = useAtom(vanguardSupportFilterAtom);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', ml: 3 }}>
      {allVanguardSupportSearch().map(flag => {
        return (
          <CheckBoxItem
            key={typeof flag !== 'string' ? intoStatusPattern(flag) : flag}
            name={
              typeof flag === 'string'
                ? supportPatternToJapanese(flag)
                : statusPatternToJapanese(intoStatusPattern(flag))
            }
            checked={filter.some(v => {
              if (typeof v === 'string' && typeof flag === 'string') {
                return v === flag;
              }
              if (typeof v !== 'string' && typeof flag !== 'string') {
                return v.status === flag.status && v.upDown === flag.upDown;
              }
              return false;
            })}
            handleChange={() => {
              setFilter(prev => {
                if (
                  filter.some(v => {
                    if (typeof v === 'string' && typeof flag === 'string') {
                      return v === flag;
                    }
                    if (typeof v !== 'string' && typeof flag !== 'string') {
                      return (
                        v.status === flag.status && v.upDown === flag.upDown
                      );
                    }
                    return false;
                  })
                ) {
                  return prev.filter(v => {
                    if (typeof v === 'string' && typeof flag === 'string') {
                      return v !== flag;
                    }
                    if (typeof v !== 'string' && typeof flag !== 'string') {
                      return !(
                        v.status === flag.status && v.upDown === flag.upDown
                      );
                    }
                    return true;
                  });
                }
                return [...prev, flag];
              });
            }}
          />
        );
      })}
    </Box>
  );
}

export function AssistSupportCheckbox() {
  const [filter, setFilter] = useAtom(assistSupportFilterAtom);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', ml: 3 }}>
      {allAssistSupportSearch().map(flag => {
        return (
          <CheckBoxItem
            key={typeof flag !== 'string' ? intoStatusPattern(flag) : flag}
            name={
              typeof flag === 'string'
                ? supportPatternToJapanese(flag)
                : statusPatternToJapanese(intoStatusPattern(flag))
            }
            checked={filter.some(v => {
              if (typeof v === 'string' && typeof flag === 'string') {
                return v === flag;
              }
              if (typeof v !== 'string' && typeof flag !== 'string') {
                return v.status === flag.status && v.upDown === flag.upDown;
              }
              return false;
            })}
            handleChange={() => {
              setFilter(prev => {
                if (
                  filter.some(v => {
                    if (typeof v === 'string' && typeof flag === 'string') {
                      return v === flag;
                    }
                    if (typeof v !== 'string' && typeof flag !== 'string') {
                      return (
                        v.status === flag.status && v.upDown === flag.upDown
                      );
                    }
                    return false;
                  })
                ) {
                  return prev.filter(v => {
                    if (typeof v === 'string' && typeof flag === 'string') {
                      return v !== flag;
                    }
                    if (typeof v !== 'string' && typeof flag !== 'string') {
                      return !(
                        v.status === flag.status && v.upDown === flag.upDown
                      );
                    }
                    return true;
                  });
                }
                return [...prev, flag];
              });
            }}
          />
        );
      })}
    </Box>
  );
}

export function RecoverySupportCheckbox() {
  const [filter, setFilter] = useAtom(recoverySupportFilterAtom);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', ml: 3 }}>
      {allRecoverySupportSearch().map(flag => {
        return (
          <CheckBoxItem
            key={typeof flag !== 'string' ? intoStatusPattern(flag) : flag}
            name={
              typeof flag === 'string'
                ? supportPatternToJapanese(flag)
                : statusPatternToJapanese(intoStatusPattern(flag))
            }
            checked={filter.some(v => {
              if (typeof v === 'string' && typeof flag === 'string') {
                return v === flag;
              }
              if (typeof v !== 'string' && typeof flag !== 'string') {
                return v.status === flag.status && v.upDown === flag.upDown;
              }
              return false;
            })}
            handleChange={() => {
              setFilter(prev => {
                if (
                  filter.some(v => {
                    if (typeof v === 'string' && typeof flag === 'string') {
                      return v === flag;
                    }
                    if (typeof v !== 'string' && typeof flag !== 'string') {
                      return (
                        v.status === flag.status && v.upDown === flag.upDown
                      );
                    }
                    return false;
                  })
                ) {
                  return prev.filter(v => {
                    if (typeof v === 'string' && typeof flag === 'string') {
                      return v !== flag;
                    }
                    if (typeof v !== 'string' && typeof flag !== 'string') {
                      return !(
                        v.status === flag.status && v.upDown === flag.upDown
                      );
                    }
                    return true;
                  });
                }
                return [...prev, flag];
              });
            }}
          />
        );
      })}
    </Box>
  );
}

export function OtherSupportCheckbox() {
  const [filter, setFilter] = useAtom(otherSupportFilterAtom);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', ml: 3 }}>
      {otherSupportSearch.map(flag => {
        return (
          <CheckBoxItem
            key={flag}
            name={flag === 'MpCostDown' ? 'MP消費DOWN' : '効果範囲+1'}
            checked={filter.includes(flag)}
            handleChange={() => {
              setFilter(prev => {
                if (filter.includes(flag)) {
                  return prev.filter(v => v !== flag);
                }
                return [...prev, flag];
              });
            }}
          />
        );
      })}
    </Box>
  );
}

export default function Search() {
  const [value, setValue] = useState('1');
  const [_, resetFilters] = useAtom(resetFilterAtom);
  const handleChange = (_: SyntheticEvent, newValue: string) => {
    setValue(newValue);
  };

  return (
    <Box sx={{ width: '100%', typography: 'body1' }}>
      <Button onClick={resetFilters}>リセット</Button>
      <TabContext value={value}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <TabList
            onChange={handleChange}
            variant={'scrollable'}
            scrollButtons='auto'
          >
            <Tab label='ラベル' value='1' />
            <Tab label='基礎ステータス（スキル）' value='2' />
            <Tab label='属性ステータス（スキル）' value='3' />
            <Tab label='その他（スキル）' value='4' />
            <Tab label='前衛（補助スキル）' value='5' />
            <Tab label='支援妨害（補助スキル）' value='6' />
            <Tab label='回復（補助スキル）' value='7' />
            <Tab label='その他（補助スキル）' value='8' />
          </TabList>
        </Box>
        <TabPanel value='1'>
          <LabelCheckbox />
        </TabPanel>
        <TabPanel value='2'>
          <BasicStatusCheckbox />
        </TabPanel>
        <TabPanel value='3'>
          <ElementStatusCheckbox />
        </TabPanel>
        <TabPanel value='4'>
          <OtherSkillCheckbox />
        </TabPanel>
        <TabPanel value='5'>
          <VanguardSupportCheckbox />
        </TabPanel>
        <TabPanel value='6'>
          <AssistSupportCheckbox />
        </TabPanel>
        <TabPanel value='7'>
          <RecoverySupportCheckbox />
        </TabPanel>
        <TabPanel value='8'>
          <OtherSupportCheckbox />
        </TabPanel>
      </TabContext>
    </Box>
  );
}
