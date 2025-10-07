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
    return this.shifts.find(s => s.label === label);
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
}

// Singleton instance
export const shiftsConfig = new ShiftsConfig();

