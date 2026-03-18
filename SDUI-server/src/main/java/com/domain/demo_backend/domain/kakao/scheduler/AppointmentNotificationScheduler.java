package com.domain.demo_backend.domain.kakao.scheduler;

import com.domain.demo_backend.domain.kakao.service.KakaoNotificationService;
import com.domain.demo_backend.domain.time.domain.GoalSetting;
import com.domain.demo_backend.domain.time.domain.GoalSettingRepository;
import com.domain.demo_backend.domain.user.domain.User;
import com.domain.demo_backend.domain.user.domain.UserRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 약속 시간 전 카카오톡 알림 스케줄러.
 * 1분마다 실행, DB 쿼리 1회로 3개 창(30/90/180분) 동시 조회 후 발송.
 */
@Component
@RequiredArgsConstructor
public class AppointmentNotificationScheduler {

    private final GoalSettingRepository goalRepo;
    private final UserRepository userRepo;
    private final KakaoNotificationService notifService;
    private final Logger log = LoggerFactory.getLogger(AppointmentNotificationScheduler.class);

    @Scheduled(fixedDelay = 60000)
    public void checkAndSendNotifications() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime w30s  = now.plusMinutes(28),  w30e  = now.plusMinutes(32);
        LocalDateTime w90s  = now.plusMinutes(88),  w90e  = now.plusMinutes(92);
        LocalDateTime w180s = now.plusMinutes(178), w180e = now.plusMinutes(182);

        List<GoalSetting> pending =
                goalRepo.findAllPendingNotifications(w30s, w30e, w90s, w90e, w180s, w180e);

        for (GoalSetting goal : pending) {
            userRepo.findById(goal.getUserSqno()).ifPresent(user -> {
                if (user.getKakaoAccessToken() == null) {
                    log.debug("AppointmentScheduler-카카오 토큰 없음, skip. userSqno={}", user.getUserSqno());
                    return;
                }
                // 3개 창은 최소 154분 간격 → 동시에 겹치지 않음
                if (!goal.isNotifSent180min() && isBetween(goal.getTargetTime(), w180s, w180e))
                    sendAndMark(user, goal, 180);
                if (!goal.isNotifSent90min()  && isBetween(goal.getTargetTime(), w90s,  w90e))
                    sendAndMark(user, goal, 90);
                if (!goal.isNotifSent30min()  && isBetween(goal.getTargetTime(), w30s,  w30e))
                    sendAndMark(user, goal, 30);
            });
        }
    }

    private boolean isBetween(LocalDateTime t, LocalDateTime start, LocalDateTime end) {
        return !t.isBefore(start) && !t.isAfter(end);
    }

    private void sendAndMark(User user, GoalSetting goal, int minutesBefore) {
        try {
            notifService.sendReminder(user, goal, minutesBefore);
            switch (minutesBefore) {
                case 30  -> goal.setNotifSent30min(true);
                case 90  -> goal.setNotifSent90min(true);
                case 180 -> goal.setNotifSent180min(true);
            }
            goalRepo.save(goal);
            log.info("AppointmentScheduler-알림 발송 완료. userId={}, minutesBefore={}",
                    user.getUserId(), minutesBefore);
        } catch (Exception e) {
            log.error("AppointmentScheduler-알림 발송 실패. userId={}, minutesBefore={}",
                    user.getUserId(), minutesBefore, e);
        }
    }
}
