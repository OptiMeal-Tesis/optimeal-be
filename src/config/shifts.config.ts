export interface Shift {
  label: string;
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
}

class ShiftsConfig {
  private shifts: Shift[] = [];
  private shiftLabels: string[] = [];

  constructor() {
    this.initializeShifts();
  }

  private initializeShifts(): void {
    const shiftsEnv = process.env.DELIVERY_SHIFTS;
    
    if (shiftsEnv) {
      // Parse shifts from environment variable
      const shiftStrings = shiftsEnv.split(',').map(s => s.trim());
      this.shifts = this.parseShifts(shiftStrings);
    } else {
      // Default shifts (30-minute intervals)
      const defaultShifts = [
        '11:00-11:30',
        '11:30-12:00',
        '12:00-12:30',
        '12:30-13:00',
        '13:00-13:30',
        '13:30-14:00',
        '14:00-14:30',
        '14:30-15:00'
      ];
      this.shifts = this.parseShifts(defaultShifts);
    }

    this.shiftLabels = this.shifts.map(s => this.getShiftLabel(s));
  }

  private parseShifts(shiftStrings: string[]): Shift[] {
    return shiftStrings.map(shiftStr => {
      const [start, end] = shiftStr.split('-').map(s => s.trim());
      
      const [startHour, startMinute = '0'] = start.split(':');
      const [endHour, endMinute = '0'] = end.split(':');

      return {
        label: shiftStr,
        startHour: parseInt(startHour, 10),
        startMinute: parseInt(startMinute, 10),
        endHour: parseInt(endHour, 10),
        endMinute: parseInt(endMinute, 10),
      };
    });
  }

  private getShiftLabel(shift: Shift): string {
    return shift.label;
  }

  /**
   * Get all available shift labels including "all"
   */
  public getValidShifts(): string[] {
    return [...this.shiftLabels, 'all'];
  }

  /**
   * Get all shifts (without "all")
   */
  public getAllShifts(): Shift[] {
    return this.shifts;
  }

  /**
   * Get shift details by label
   */
  public getShiftByLabel(label: string): Shift | undefined {
    // First try exact match
    let shift = this.shifts.find(s => s.label === label);
    
    if (!shift) {
      // Try to find by parsing the time components
      // This handles cases where frontend sends different format than configured
      const parsedShift = this.parseShiftFromString(label);
      if (parsedShift) {
        shift = this.shifts.find(s => 
          s.startHour === parsedShift.startHour &&
          s.startMinute === parsedShift.startMinute &&
          s.endHour === parsedShift.endHour &&
          s.endMinute === parsedShift.endMinute
        );
      }
    }
    
    return shift;
  }

  /**
   * Parse shift from string to handle different formats
   */
  private parseShiftFromString(shiftStr: string): Shift | null {
    try {
      const [start, end] = shiftStr.split('-').map(s => s.trim());
      
      const [startHour, startMinute = '0'] = start.split(':');
      const [endHour, endMinute = '0'] = end.split(':');

      return {
        label: shiftStr,
        startHour: parseInt(startHour, 10),
        startMinute: parseInt(startMinute, 10),
        endHour: parseInt(endHour, 10),
        endMinute: parseInt(endMinute, 10),
      };
    } catch {
      return null;
    }
  }

  /**
   * Get shift label from UTC hour (for backwards compatibility with existing logic)
   * UTC hours are -3 from Argentina time
   */
  public getShiftFromUTCHour(utcHour: number): string {
    // Convert UTC hour to Argentina time (UTC-3)
    const argHour = utcHour - 3;
    
    // Find the shift that contains this hour
    const shift = this.shifts.find(s => {
      if (s.startHour === argHour || s.endHour === argHour) {
        return true;
      }
      if (s.startHour < argHour && argHour < s.endHour) {
        return true;
      }
      return false;
    });

    return shift ? shift.label : 'all';
  }

  /**
   * Get the earliest and latest hours for all shifts
   */
  public getShiftHourRange(): { minHour: number; maxHour: number } {
    const hours = this.shifts.flatMap(s => [s.startHour, s.endHour]);
    return {
      minHour: Math.min(...hours),
      maxHour: Math.max(...hours),
    };
  }

  /**
   * Get valid UTC hours for order pickup (for validation)
   */
  public getValidUTCHours(): number[] {
    const range = this.getShiftHourRange();
    const utcHours: number[] = [];
    
    // Convert Argentina hours to UTC (+3)
    for (let argHour = range.minHour; argHour <= range.maxHour; argHour++) {
      utcHours.push(argHour + 3);
    }
    
    return utcHours;
  }

  /**
   * Convert shift to pickUpTime (ISO datetime string)
   * Uses the start time of the shift and today's date
   */
  public shiftToPickUpTime(shift: string): string | null {
    const shiftDetails = this.getShiftByLabel(shift);
    
    if (!shiftDetails) {
      return null;
    }

    const now = new Date();
    const today = now.toISOString().split('T')[0];
    
    // Create pickup time at the start of the shift
    const hour = String(shiftDetails.startHour).padStart(2, '0');
    const minute = String(shiftDetails.startMinute).padStart(2, '0');
    
    return `${today}T${hour}:${minute}:00`;
  }

  /**
   * Validate if a shift is valid
   */
  public isValidShift(shift: string): boolean {
    return this.getValidShifts().includes(shift);
  }

  /**
   * Convert pickUpTime to shift label
   * Finds which shift contains the given time
   */
  public pickUpTimeToShift(pickUpTime: Date | string): string | null {
    const date = typeof pickUpTime === 'string' ? new Date(pickUpTime) : pickUpTime;
    
    const hour = date.getHours();
    const minute = date.getMinutes();
    
    // Find the shift that contains this time
    const shift = this.shifts.find(s => {
      // Check if the time is within this shift's range
      if (s.startHour < hour && hour < s.endHour) {
        return true;
      }
      if (s.startHour === hour && s.startMinute <= minute) {
        if (s.endHour > hour) return true;
        if (s.endHour === hour && s.endMinute > minute) return true;
      }
      if (s.endHour === hour && minute < s.endMinute) {
        return true;
      }
      return false;
    });

    return shift ? shift.label : null;
  }
}

// Singleton instance
export const shiftsConfig = new ShiftsConfig();

