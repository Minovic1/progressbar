document.addEventListener("DOMContentLoaded", () => {
  const ProgressBar = {
    init() {
      this.progressContainer = document.querySelector(".progress-container");
      this.progressTrack = document.getElementById("progress-track");
      this.progressBar = document.getElementById("progress-bar");
      this.progressTooltip = document.getElementById("progress-tooltip");
      this.progressCount = document.getElementById("progress-count");
      this.progressLabel = document.getElementById("progress-label");
      this.animationFrameRequest = null;
      this.cancelledTimer = null;
      this.duration = 0;
      this.startTime = 0;
      this.currentPercent = 0;
      this.setupListeners();
    },

    setupListeners() {
      window.addEventListener("message", (event) => {
        const { data } = event;
        if (!data || !data.action) {
          return;
        }

        if (data.action === "progress") {
          this.reset();
          this.update(data);
        } else if (data.action === "cancel") {
          this.cancel();
        }
      });
    },

    clamp(value, min, max) {
      return Math.min(Math.max(value, min), max);
    },

    showLabel(text) {
      if (!this.progressLabel) {
        return;
      }

      const value = typeof text === "string" ? text.trim() : "";
      if (value.length > 0) {
        this.progressLabel.textContent = value;
        this.progressLabel.style.display = "block";
      } else {
        this.progressLabel.textContent = "";
        this.progressLabel.style.display = "none";
      }
    },

    setTooltipPosition(percent) {
      if (!this.progressTrack || !this.progressTooltip) {
        return;
      }

      const trackWidth = this.progressTrack.clientWidth;
      if (trackWidth <= 0) {
        return;
      }

      const tooltipWidth = this.progressTooltip.offsetWidth || 0;
      const rawLeft = (percent / 100) * trackWidth;
      const minLeft = tooltipWidth / 2;
      const maxLeft = trackWidth - tooltipWidth / 2;
      const clampedLeft = this.clamp(rawLeft, minLeft, maxLeft);
      this.progressTooltip.style.left = `${clampedLeft}px`;
    },

    reset() {
      if (this.animationFrameRequest) {
        cancelAnimationFrame(this.animationFrameRequest);
        this.animationFrameRequest = null;
      }
      clearTimeout(this.cancelledTimer);

      this.currentPercent = 0;
      this.progressContainer?.classList.remove("complete", "cancelled");

      if (this.progressBar) {
        this.progressBar.style.width = "0%";
      }

      if (this.progressCount) {
        this.progressCount.textContent = "0%";
      }

      this.setTooltipPosition(0);
      this.showLabel("");
    },

    update(data) {
      if (!this.progressContainer || !this.progressBar || !this.progressCount) {
        return;
      }

      const parsedDuration = Number.parseInt(data.duration, 10);
      this.duration = Number.isFinite(parsedDuration) ? Math.max(parsedDuration, 0) : 0;
      this.startTime = Date.now();
      this.currentPercent = 0;

      this.showLabel(data.label || "");
      this.progressContainer.style.display = "flex";
      this.progressBar.style.width = "0%";
      this.progressCount.textContent = "0%";

      requestAnimationFrame(() => this.setTooltipPosition(0));

      if (this.duration === 0) {
        this.onComplete();
        return;
      }

      const animate = () => {
        const elapsed = Math.min(Date.now() - this.startTime, this.duration);
        const progress = elapsed / this.duration;
        const percent = this.clamp(progress * 100, 0, 100);

        this.currentPercent = percent;
        this.progressBar.style.width = `${percent}%`;
        this.progressCount.textContent = `${Math.round(percent)}%`;
        this.setTooltipPosition(percent);

        if (progress < 1) {
          this.animationFrameRequest = requestAnimationFrame(animate);
        } else {
          this.onComplete();
        }
      };

      this.animationFrameRequest = requestAnimationFrame(animate);
    },

    cancel() {
      if (!this.progressContainer || !this.progressBar || !this.progressCount) {
        return;
      }

      if (this.animationFrameRequest) {
        cancelAnimationFrame(this.animationFrameRequest);
        this.animationFrameRequest = null;
      }

      clearTimeout(this.cancelledTimer);

      const percent = Math.round(this.currentPercent);
      this.progressContainer.classList.add("cancelled");
      this.progressContainer.style.display = "flex";
      this.showLabel("Cancelled");

      this.progressBar.style.width = `${percent}%`;
      this.progressCount.textContent = `${percent}%`;
      this.setTooltipPosition(percent);

      this.cancelledTimer = setTimeout(() => this.onCancel(), 900);
    },

    onComplete() {
      if (!this.progressContainer || !this.progressBar || !this.progressCount) {
        return;
      }

      if (this.animationFrameRequest) {
        cancelAnimationFrame(this.animationFrameRequest);
        this.animationFrameRequest = null;
      }

      clearTimeout(this.cancelledTimer);

      this.currentPercent = 100;
      this.progressContainer.classList.add("complete");
      this.progressBar.style.width = "100%";
      this.progressCount.textContent = "100%";
      this.setTooltipPosition(100);

      this.postAction("FinishAction");

      setTimeout(() => {
        this.progressContainer.style.display = "none";
        this.progressContainer.classList.remove("complete");
        this.progressBar.style.width = "0%";
        this.progressCount.textContent = "0%";
        this.currentPercent = 0;
        this.setTooltipPosition(0);
        this.showLabel("");
      }, 1100);
    },

    onCancel() {
      if (!this.progressContainer || !this.progressBar || !this.progressCount) {
        return;
      }

      this.progressContainer.style.display = "none";
      this.progressContainer.classList.remove("cancelled");
      this.progressBar.style.width = "0%";
      this.progressCount.textContent = "0%";
      this.currentPercent = 0;
      this.setTooltipPosition(0);
      this.showLabel("");
    },

    postAction(action) {
      fetch(`https://progressbar/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      }).catch(() => {
      });
    },
  };

  ProgressBar.init();
});
