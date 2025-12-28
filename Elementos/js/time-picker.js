// Time Picker Component
class TimePicker {
    constructor() {
        this.currentInput = null;
        this.selectedHour = 12;
        this.selectedMinute = 0;
        this.isPM = null; // null = no seleccionado, true = PM, false = AM
        this.isSelectingHour = true;
        this.currentRotation = 0; // Initialize to 12 o'clock position
        this.createModal();
        this.attachEventListeners();
    }

    createModal() {
        const modalHTML = `
            <div class="time-picker-overlay" id="timePickerOverlay">
                <div class="time-picker-modal">
                    <div class="time-picker-header">
                        <h3>Seleccione el Tiempo</h3>
                        <div class="time-display">
                            <div class="time-display-box active" id="hourDisplay">12</div>
                            <div class="time-display-separator">:</div>
                            <div class="time-display-box" id="minuteDisplay">00</div>
                            <div class="period-selector">
                                <button class="period-btn" id="amBtn">AM</button>
                                <button class="period-btn" id="pmBtn">PM</button>
                            </div>
                        </div>
                    </div>
                    <div class="clock-container">
                        <div class="clock-face" id="clockFace"></div>
                        <div class="clock-hand" id="clockHand"></div>
                        <div class="clock-center"></div>
                    </div>
                    <div class="time-picker-actions">
                        <button class="time-picker-btn" id="timePickerCancel">CANCELAR</button>
                        <button class="time-picker-btn primary" id="timePickerOk">OK</button>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        this.overlay = document.getElementById('timePickerOverlay');
        this.hourDisplay = document.getElementById('hourDisplay');
        this.minuteDisplay = document.getElementById('minuteDisplay');
        this.clockFace = document.getElementById('clockFace');
        this.clockHand = document.getElementById('clockHand');
        this.amBtn = document.getElementById('amBtn');
        this.pmBtn = document.getElementById('pmBtn');
    }

    attachEventListeners() {
        // Close modal
        document.getElementById('timePickerCancel').addEventListener('click', () => this.close());
        document.getElementById('timePickerOk').addEventListener('click', () => this.confirm());

        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay) this.close();
        });

        // Toggle hour/minute selection
        this.hourDisplay.addEventListener('click', () => this.switchToHourSelection());
        this.minuteDisplay.addEventListener('click', () => this.switchToMinuteSelection());

        // AM/PM toggle
        this.amBtn.addEventListener('click', () => this.setPeriod(false));
        this.pmBtn.addEventListener('click', () => this.setPeriod(true));
    }

    open(inputElement) {
        this.currentInput = inputElement;

        // Parse existing value if any
        const value = inputElement.dataset.timeValue || '';
        if (value) {
            const [time, period] = value.split(' ');
            const [hours, minutes] = time.split(':');
            this.selectedHour = parseInt(hours);
            this.selectedMinute = parseInt(minutes);
            this.isPM = period === 'PM';
        } else {
            // Reset to default values - no period selected
            this.selectedHour = 12;
            this.selectedMinute = 0;
            this.isPM = null; // No period selected by default
        }

        this.isSelectingHour = true;
        // Initialize rotation to current hour without animation
        this.currentRotation = this.selectedHour === 12 ? 0 : this.selectedHour * 30;
        this.updateDisplay();
        this.updatePeriodButtons();
        this.renderClock();
        this.overlay.classList.add('active');
    }

    close() {
        this.overlay.classList.remove('active');
        this.currentInput = null;
    }

    confirm() {
        // Validate that AM/PM is selected
        if (this.isPM === null) {
            // Highlight the period buttons to indicate they need selection
            this.amBtn.classList.add('required');
            this.pmBtn.classList.add('required');

            // Remove highlight after animation
            setTimeout(() => {
                this.amBtn.classList.remove('required');
                this.pmBtn.classList.remove('required');
            }, 1000);
            return; // Don't close, require AM/PM selection
        }

        if (this.currentInput) {
            const timeString = this.getFormattedTime();
            this.currentInput.dataset.timeValue = timeString;
            this.currentInput.querySelector('span').textContent = timeString;
            this.currentInput.classList.remove('empty');

            // Trigger change event
            const event = new Event('change', { bubbles: true });
            this.currentInput.dispatchEvent(event);
        }
        this.close();
    }

    switchToHourSelection() {
        this.isSelectingHour = true;
        this.hourDisplay.classList.add('active');
        this.minuteDisplay.classList.remove('active');
        // Reset rotation to hour position when switching
        this.currentRotation = this.selectedHour === 12 ? 0 : this.selectedHour * 30;
        this.renderClock();
    }

    switchToMinuteSelection() {
        this.isSelectingHour = false;
        this.hourDisplay.classList.remove('active');
        this.minuteDisplay.classList.add('active');
        // Reset rotation to minute position when switching
        this.currentRotation = (this.selectedMinute / 5) * 30;
        this.renderClock();
    }

    setPeriod(isPM) {
        this.isPM = isPM;
        this.updatePeriodButtons();
        this.updateDisplay();
    }

    updatePeriodButtons() {
        // Remove required class when selecting
        this.amBtn.classList.remove('required');
        this.pmBtn.classList.remove('required');

        if (this.isPM === true) {
            this.amBtn.classList.remove('active');
            this.pmBtn.classList.add('active');
        } else if (this.isPM === false) {
            this.amBtn.classList.add('active');
            this.pmBtn.classList.remove('active');
        } else {
            // No period selected
            this.amBtn.classList.remove('active');
            this.pmBtn.classList.remove('active');
        }
    }

    renderClock() {
        this.clockFace.innerHTML = '';
        const numbers = this.isSelectingHour ?
            [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] :
            [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

        numbers.forEach((num, index) => {
            // Calculate angle: 12/0 is at top (0°), then clockwise
            // For 12-hour: 12=0°, 1=30°, 2=60°, 3=90°, etc.
            // For minutes: 0=0°, 5=30°, 10=60°, 15=90°, etc.
            const angle = index * 30; // Each position is 30 degrees apart
            const radian = ((angle - 90) * Math.PI) / 180; // -90 to start from top
            const radius = 110; // Distance from center

            const x = 140 + radius * Math.cos(radian) - 20; // 140 is center, 20 is half of number width
            const y = 140 + radius * Math.sin(radian) - 20;

            const numberEl = document.createElement('div');
            numberEl.className = 'clock-number';
            numberEl.textContent = num;
            numberEl.style.left = `${x}px`;
            numberEl.style.top = `${y}px`;

            if (this.isSelectingHour && num === this.selectedHour) {
                numberEl.classList.add('selected');
            } else if (!this.isSelectingHour && num === this.selectedMinute) {
                numberEl.classList.add('selected');
            }

            numberEl.addEventListener('click', () => {
                if (this.isSelectingHour) {
                    this.selectedHour = num;
                    this.updateDisplay();
                    // Auto-switch to minute selection after selecting hour
                    setTimeout(() => this.switchToMinuteSelection(), 300);
                } else {
                    this.selectedMinute = num;
                    this.updateDisplay();
                }
                this.renderClock();
            });

            this.clockFace.appendChild(numberEl);
        });

        this.updateClockHand();
    }

    updateClockHand() {
        let value = this.isSelectingHour ? this.selectedHour : this.selectedMinute;
        let targetAngle;

        if (this.isSelectingHour) {
            // For hours: 12 is at top (0 degrees), 3 is at 90 degrees, etc.
            targetAngle = value === 12 ? 0 : value * 30;
        } else {
            // For minutes: 0 is at top (0 degrees), 15 is at 90 degrees, etc.
            targetAngle = (value / 5) * 30;
        }

        // If currentRotation is not set, initialize it
        if (this.currentRotation === undefined) {
            this.currentRotation = targetAngle;
            this.clockHand.style.transform = `rotate(${targetAngle}deg)`;
            return;
        }

        // Normalize current rotation to 0-360 range for comparison
        const normalizedCurrent = ((this.currentRotation % 360) + 360) % 360;

        // Calculate the difference
        let diff = targetAngle - normalizedCurrent;

        // Find shortest path: if difference is more than 180°, go the other way
        if (diff > 180) {
            diff -= 360;
        } else if (diff < -180) {
            diff += 360;
        }

        // Update rotation by adding the shortest path difference
        this.currentRotation += diff;

        // Apply the rotation (no normalization, let it be continuous)
        this.clockHand.style.transform = `rotate(${this.currentRotation}deg)`;
    }

    updateDisplay() {
        this.hourDisplay.textContent = this.selectedHour.toString().padStart(2, '0');
        this.minuteDisplay.textContent = this.selectedMinute.toString().padStart(2, '0');
        this.updateClockHand();
    }

    getFormattedTime() {
        const hour = this.selectedHour.toString().padStart(2, '0');
        const minute = this.selectedMinute.toString().padStart(2, '0');
        const period = this.isPM ? 'PM' : 'AM';
        return `${hour}:${minute} ${period}`;
    }

    // Convert 12-hour format to 24-hour format for form submission
    get24HourFormat() {
        let hour = this.selectedHour;
        if (this.isPM && hour !== 12) {
            hour += 12;
        } else if (!this.isPM && hour === 12) {
            hour = 0;
        }
        return `${hour.toString().padStart(2, '0')}:${this.selectedMinute.toString().padStart(2, '0')}`;
    }
}

// Initialize time picker
let timePickerInstance;
document.addEventListener('DOMContentLoaded', () => {
    timePickerInstance = new TimePicker();
});

// Helper function to create time input display
function createTimeInputDisplay(id, labelText) {
    return `
        <div class="form-group">
            <label>${labelText}</label>
            <div class="time-input-display empty" id="${id}" data-time-value="">
                <i class="bi bi-clock"></i>
                <span>Seleccionar hora</span>
            </div>
        </div>
    `;
}

// Helper function to attach time picker to elements
function attachTimePicker(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.addEventListener('click', () => {
            if (timePickerInstance) {
                timePickerInstance.open(element);
            }
        });
    }
}
