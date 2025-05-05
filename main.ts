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
        let sensor_value = pins.i2cReadNumber(value, NumberFormat.Int8LE, false)
        return sensor_value <= -2 ? Math.map(sensor_value, -128, -2, 1023, 0) : 1023
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
    //% value.min=0 value.max=1023
    //% value.defl=512
    //% blockId="KuangRobot_remote" block="Remote control with command %name and value %value"
    export function RemoteControlRobot(name: string, value: number): void {
        let L_Speed = 1023
        let R_Speed = 1023
        let L_percentage = 0
        let R_percentage = 0
        let L_percentage_backward = 0
        let R_percentage_backward = 0
        let rest_x = 0
        let rest_y = 0

        if (name == "k_y" && value < 506) {
            L_percentage = Math.map(value, 505, 0, 0, 1)
            R_percentage = Math.map(value, 505, 0, 0, 1)
        } else if (name == "k_y" && value > 510) {
            L_percentage_backward = Math.map(value, 511, 1023, 0, 1)
            R_percentage_backward = Math.map(value, 511, 1023, 0, 1)
        }

        if (name == "k_x" && value < 506) {
            L_percentage = Math.map(value, 505, 0, 0, 1)
            R_percentage_backward = Math.map(value, 505, 0, 0, 1)
        } else if (name == "k_x" && value > 510) {
            L_percentage_backward = Math.map(value, 511, 1023, 0, 1)
            R_percentage = Math.map(value, 511, 1023, 0, 1)
        }

        if (name == "k_x" && value >= 507 && value <= 509) {
            rest_x = 1
        }
        if (name == "k_y" && value >= 507 && value <= 509) {
            rest_y = 1
        }

        if (rest_x == 1 && rest_y == 1) {
            L_percentage = 0
            R_percentage = 0
            L_percentage_backward = 0
            R_percentage_backward = 0
        }

        pins.analogWritePin(AnalogPin.P13, L_Speed * L_percentage)
        pins.analogWritePin(AnalogPin.P12, L_Speed * L_percentage_backward)
        pins.analogWritePin(AnalogPin.P15, R_Speed * R_percentage)
        pins.analogWritePin(AnalogPin.P14, R_Speed * R_percentage_backward)
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
        radio.sendValue("k_x", pins.analogReadPin(AnalogReadWritePin.P2))
        radio.sendValue("k_y", pins.analogReadPin(AnalogReadWritePin.P1))
        radio.sendValue("k_s", pins.digitalReadPin(DigitalPin.P8))
        radio.sendValue("k_b1", pins.digitalReadPin(DigitalPin.P13))
        radio.sendValue("k_b2", pins.digitalReadPin(DigitalPin.P14))
        radio.sendValue("k_b3", pins.digitalReadPin(DigitalPin.P15))
        radio.sendValue("k_b4", pins.digitalReadPin(DigitalPin.P16))
    }


}
