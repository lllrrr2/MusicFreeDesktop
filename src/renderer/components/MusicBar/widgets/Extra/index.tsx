import SvgAsset from "@/renderer/components/SvgAsset";
import "./index.scss";
import SwitchCase from "@/renderer/components/SwitchCase";
import trackPlayer from "@renderer/core/track-player";
import {useRef, useState} from "react";
import Condition from "@/renderer/components/Condition";
import Slider from "rc-slider";
import {showModal} from "@/renderer/components/Modal";
import classNames from "@/renderer/utils/classnames";
import {getCurrentPanel, hidePanel, showPanel,} from "@/renderer/components/Panel";
import {useTranslation} from "react-i18next";
import AppConfig from "@shared/app-config/renderer";
import {isCN} from "@/shared/i18n/renderer";
import useAppConfig from "@/hooks/useAppConfig";
import {RepeatMode} from "@/common/constant";
import {useQuality, useRepeatMode, useSpeed, useVolume} from "@renderer/core/track-player/hooks";
import {appWindowUtil} from "@shared/utils/renderer";
import {musicDetailShownStore} from "@renderer/components/MusicDetail/store";

export default function Extra() {
  const repeatMode = useRepeatMode();
  const { t } = useTranslation();

  return (
    <div className="music-extra">
      <QualityBtn></QualityBtn>
      <SpeedBtn></SpeedBtn>
      <VolumeBtn></VolumeBtn>
      <LyricBtn></LyricBtn>
      <div
        className="extra-btn"
        onClick={() => {
          trackPlayer.toggleRepeatMode();
        }}
        title={
          repeatMode === RepeatMode.Loop
            ? t("media.music_repeat_mode_loop")
            : repeatMode === RepeatMode.Queue
            ? t("media.music_repeat_mode_queue")
            : t("media.music_repeat_mode_shuffle")
        }
      >
        <SwitchCase.Switch switch={repeatMode}>
          <SwitchCase.Case case={RepeatMode.Loop}>
            <SvgAsset iconName="repeat-song"></SvgAsset>
          </SwitchCase.Case>
          <SwitchCase.Case case={RepeatMode.Queue}>
            <SvgAsset iconName="repeat-song-1"></SvgAsset>
          </SwitchCase.Case>
          <SwitchCase.Case case={RepeatMode.Shuffle}>
            <SvgAsset iconName="shuffle"></SvgAsset>
          </SwitchCase.Case>
        </SwitchCase.Switch>
      </div>
      <div
        className="extra-btn"
        title={t("media.playlist")}
        role="button"
        onClick={() => {
          if (getCurrentPanel()?.type === "PlayList") {
            hidePanel();
          } else {
            showPanel("PlayList", {
              coverHeader: musicDetailShownStore.getValue()
            });
          }
        }}
      >
        <SvgAsset iconName="playlist"></SvgAsset>
      </div>
    </div>
  );
}

function VolumeBtn() {
  const volume = useVolume();
  const tmpVolumeRef = useRef<number | null>(null);
  const [showVolumeBubble, setShowVolumeBubble] = useState(false);
  const { t } = useTranslation();

  return (
    <div
      className="extra-btn"
      role="button"
      onMouseOver={() => {
        setShowVolumeBubble(true);
      }}
      onMouseOut={() => {
        setShowVolumeBubble(false);
      }}
      onClick={(e) => {
        if (tmpVolumeRef.current === null) {
          tmpVolumeRef.current = 0;
        }
        tmpVolumeRef.current =
          tmpVolumeRef.current === volume
            ? volume === 0
              ? 1
              : 0
            : tmpVolumeRef.current;
        trackPlayer.setVolume(tmpVolumeRef.current);
        tmpVolumeRef.current = volume;
      }}
    >
      <Condition condition={showVolumeBubble}>
        <div
          className="volume-bubble-container shadow backdrop-color"
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          <div className="volume-slider-container">
            <Slider
              vertical
              min={0}
              max={1}
              step={0.01}
              onChange={(val) => {
                trackPlayer.setVolume(val as number);
              }}
              value={volume}
              styles={{
                track: {
                  background: "var(--primaryColor)",
                },
                handle: {
                  height: 12,
                  width: 12,
                  marginLeft: -4,
                  borderColor: "var(--primaryColor)",
                },
                rail: {
                  background: "#d8d8d8",
                },
              }}
            ></Slider>
          </div>
          <div className="volume-slider-tag">{(volume * 100).toFixed(0)}%</div>
        </div>
      </Condition>
      <SvgAsset
        title={volume === 0 ? t("music_bar.unmute") : t("music_bar.mute")}
        iconName={volume === 0 ? "speaker-x-mark" : "speaker-wave"}
      ></SvgAsset>
    </div>
  );
}

function SpeedBtn() {
  const speed = useSpeed();
  const [showSpeedBubble, setShowSpeedBubble] = useState(false);
  const tmpSpeedRef = useRef<number | null>(null);
  const { t } = useTranslation();

  return (
    <div
      className="extra-btn"
      role="button"
      onMouseOver={() => {
        setShowSpeedBubble(true);
      }}
      onMouseOut={() => {
        setShowSpeedBubble(false);
      }}
      onClick={() => {
        if (tmpSpeedRef.current === null || tmpSpeedRef.current === speed) {
          tmpSpeedRef.current = 1;
        }

        trackPlayer.setSpeed(tmpSpeedRef.current);
        tmpSpeedRef.current = speed;
      }}
    >
      <Condition condition={showSpeedBubble}>
        <div
          className="volume-bubble-container shadow backdrop-color"
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          <div className="volume-slider-container">
            <Slider
              vertical
              min={0.25}
              max={2}
              step={0.05}
              onChange={(val) => {
                trackPlayer.setSpeed(val as number);
              }}
              value={speed}
              trackStyle={{
                background: "var(--primaryColor)",
              }}
              handleStyle={{
                height: 12,
                width: 12,
                marginLeft: -4,
                borderColor: "var(--primaryColor)",
              }}
              railStyle={{
                background: "#d8d8d8",
              }}
            ></Slider>
          </div>
          <div className="volume-slider-tag">{speed.toFixed(2)}x</div>
        </div>
      </Condition>
      <SvgAsset
        title={t("music_bar.playback_speed")}
        iconName={"dashboard-speed"}
      ></SvgAsset>
    </div>
  );
}

function QualityBtn() {
  const quality = useQuality();
  const { t } = useTranslation();

  return (
    <div
      className="extra-btn"
      role="button"
      onClick={() => {
        showModal("SelectOne", {
          title: t("music_bar.choose_music_quality"),
          defaultValue: quality,
          defaultExtra: true,
          extra: t("music_bar.only_set_for_current_music"),
          choices: [
            {
              value: "low",
              label: t("media.music_quality_low"),
            },
            {
              value: "standard",
              label: t("media.music_quality_standard"),
            },
            {
              value: "high",
              label: t("media.music_quality_high"),
            },
            {
              value: "super",
              label: t("media.music_quality_super"),
            },
          ],
          onOk(value, extra) {
            trackPlayer.setQuality(value as IMusic.IQualityKey);
            if (!extra) {
              AppConfig.setConfig({
                "playMusic.defaultQuality": value
              });
            }
          },
        });
      }}
    >
      <SwitchCase.Switch switch={quality}>
        <SwitchCase.Case case={"low"}>
          <SvgAsset
            title={t("media.music_quality_low")}
            iconName={"lq"}
          ></SvgAsset>
        </SwitchCase.Case>
        <SwitchCase.Case case={"standard"}>
          <SvgAsset
            title={t("media.music_quality_standard")}
            iconName={"sd"}
          ></SvgAsset>
        </SwitchCase.Case>
        <SwitchCase.Case case={"high"}>
          <SvgAsset
            title={t("media.music_quality_high")}
            iconName={"hq"}
          ></SvgAsset>
        </SwitchCase.Case>
        <SwitchCase.Case case={"super"}>
          <SvgAsset title={t("music_quality_super")} iconName={"sq"}></SvgAsset>
        </SwitchCase.Case>
      </SwitchCase.Switch>
    </div>
  );
}

function LyricBtn() {
  const enableDesktopLyric = useAppConfig("lyric.enableDesktopLyric");
  const { t } = useTranslation();

  return (
    <div
      className={classNames({
        "extra-btn": true,
        highlight: enableDesktopLyric,
      })}
      role="button"
      onClick={async () => {
        appWindowUtil.setLyricWindow(!enableDesktopLyric);
      }}
    >
      <SvgAsset
        iconName={isCN() ? "lyric" : "lyric-en"}
        title={t("music_bar.desktop_lyric")}
      ></SvgAsset>
    </div>
  );
}
