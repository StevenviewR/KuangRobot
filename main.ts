namespace kuangRobot {

    //% block
    //% value.min=0 value.max=127
    //% value.defl=18
    //% block="Initiate the line sensor at I2C address %value"
    export function startLineSensor(value: number): void {
        pins.i2cWriteNumber(value, 48, NumberFormat.Int8LE, false)
    }

    //% block
    //% value.min=0 value.max=127
    //% value.defl=18
    //% block="Read line sensor for LEFT motor at I2C address %value"
    export function readLineLeft(value: number): number {
        basic.pause(1)
        let sensor_value = pins.i2cReadNumber(value, NumberFormat.Int8LE, false)
        return sensor_value <= -2 ? 1023 : Math.map(sensor_value, 0, 128, 1023, 0)
    }

    //% block
    //% value.min=0 value.max=127
    //% value.defl=18
    //% block="Read line sensor for RIGHT motor at I2C address %value"
    export function readLineRight(value: number): number {
        basic.pause(1)
        let sensor_value2 = pins.i2cReadNumber(value, NumberFormat.Int8LE, false)
        return sensor_value2 <= -2 ? Math.map(sensor_value2, -128, -2, 1023, 0) : 1023
    }

    //% block="Set line-following speed: left %left_speed right %right_speed"
    //% left_speed.min=0 left_speed.max=1023
    //% right_speed.min=0 right_speed.max=1023
    export function setLineFollowingSpeed(left_speed: number, right_speed: number): void {
        pins.analogWritePin(AnalogPin.P12, 0)
        pins.analogWritePin(AnalogPin.P13, left_speed)
        pins.analogWritePin(AnalogPin.P14, 0)
        pins.analogWritePin(AnalogPin.P15, right_speed)
    }

    //% block="Stop robot"
    export function robotStop(): void {
        pins.analogWritePin(AnalogPin.P12, 0)
        pins.analogWritePin(AnalogPin.P13, 0)
        pins.analogWritePin(AnalogPin.P14, 0)
        pins.analogWritePin(AnalogPin.P15, 0)
    }

    //% block
    //% value.min=0 value.max=1023
    //% value2.min=0 value2.max=1023
    //% value.defl=512
    //% value2.defl=512
    //% blockId="KuangRobot_move" block="Drive motor at left %value and right %value2"
    export function moveRobot(value: number, value2: number): void {
        let leftPWM = Math.map(value, 0, 1023, 0, 1023)
        let rightPWM = Math.map(value2, 0, 1023, 0, 1023)
        pins.analogWritePin(AnalogPin.P13, leftPWM)
        pins.analogWritePin(AnalogPin.P15, rightPWM)
    }

    //% block
    export function remoteControlSetup(): void {
        pins.setPull(DigitalPin.P8, PinPullMode.PullUp)
        pins.setPull(DigitalPin.P13, PinPullMode.PullUp)
        pins.setPull(DigitalPin.P14, PinPullMode.PullUp)
        pins.setPull(DigitalPin.P15, PinPullMode.PullUp)
        pins.setPull(DigitalPin.P16, PinPullMode.PullUp)
    }

    //% block
    export function remoteControlSending(): void {
        const k_x = pins.analogReadPin(AnalogReadWritePin.P2)
        const k_y = pins.analogReadPin(AnalogReadWritePin.P1)
        const k_s = pins.digitalReadPin(DigitalPin.P8)
        const k_b1 = pins.digitalReadPin(DigitalPin.P13)
        const k_b2 = pins.digitalReadPin(DigitalPin.P14)
        const k_b3 = pins.digitalReadPin(DigitalPin.P15)
        const k_b4 = pins.digitalReadPin(DigitalPin.P16)

        // Short comma-separated message format
        const msg = `${k_x},${k_y},${k_s},${k_b1},${k_b2},${k_b3},${k_b4}`
        radio.sendString(msg)
        basic.pause(1)
    }

    //% block
    //% blockId="KuangRobot_remote" block="Remote control with command %input and servo %servo and angle %angle"
    export function RemoteControlRobot(input: string, servoPin: AnalogPin, angle: number): number {
        let parts = input.split(",")

        let k_x2 = parseInt(parts[0])
        let k_y2 = parseInt(parts[1])
        let k_s2 = parseInt(parts[2])
        let k_b12 = parseInt(parts[3])
        let k_b22 = parseInt(parts[4])
        let k_b32 = parseInt(parts[5])
        let k_b42 = parseInt(parts[6])

        let L_Speed = 1023
        let R_Speed = 1023
        let L_percentage = 0
        let R_percentage = 0
        let L_percentage_backward = 0
        let R_percentage_backward = 0

        if (k_y2 < 506) {
            L_percentage = Math.map(k_y2, 505, 0, 0, 1)
            R_percentage = Math.map(k_y2, 505, 0, 0, 1)
        } else if (k_y2 > 510) {
            L_percentage_backward = Math.map(k_y2, 511, 1023, 0, 1)
            R_percentage_backward = Math.map(k_y2, 511, 1023, 0, 1)
        }

        if (k_x2 >= 507 && k_x2 <= 509 && k_y2 >= 507 && k_y2 <= 509) {
            L_percentage = 0
            R_percentage = 0
            L_percentage_backward = 0
            R_percentage_backward = 0
        }

        if (k_b12 == 0) {
            pins.analogWritePin(AnalogPin.P13, 0)
            pins.analogWritePin(AnalogPin.P12, 200)
            pins.analogWritePin(AnalogPin.P15, 200)
            pins.analogWritePin(AnalogPin.P14, 0)
            basic.pause(5)
        }

        if (k_b42 == 0) {
            pins.analogWritePin(AnalogPin.P13, 200)
            pins.analogWritePin(AnalogPin.P12, 0)
            pins.analogWritePin(AnalogPin.P15, 0)
            pins.analogWritePin(AnalogPin.P14, 200)
            basic.pause(5)
        }

        if (k_b22 == 0) {
            angle = angle + 1
            if (angle >= 180) {
                angle = 180
            }
            pins.servoWritePin(AnalogPin.P1, angle)
            basic.pause(1000)
        }

        if (k_b32 == 0) {
            angle = angle - 1
            if (angle <= 0) {
                angle = 0
            }
            pins.servoWritePin(AnalogPin.P1, angle)
            basic.pause(1000)
        }

        pins.analogWritePin(AnalogPin.P13, L_Speed * L_percentage)
        pins.analogWritePin(AnalogPin.P12, L_Speed * L_percentage_backward)
        pins.analogWritePin(AnalogPin.P15, R_Speed * R_percentage)
        pins.analogWritePin(AnalogPin.P14, R_Speed * R_percentage_backward)

        return angle
    }



}
