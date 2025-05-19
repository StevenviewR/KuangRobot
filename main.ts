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
    //% blockId="remoteControlSetup" block=" Remote Control Setup UpDown (Y): %UpDown LeftRight (X): %LeftRight B1: %B1 B2: %B2 B3: %B3 B4: %B4"
    export function remoteControlSetup(UpDown: AnalogPin, LeftRight: AnalogPin, B1: AnalogPin, B2:AnalogPin, B3:AnalogPin, B4:AnalogPin): void {
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
    //% high.min=0 up_value.max=180
    //% high.defl=0
    //% low.min=0 down_value.max=180
    //% low.defl=0
    //% blockId="KuangRobot_remote" block="Receive Remote control with command %input and current servo angle %in_angle low: %low  high: %high"
    export function RemoteControlRobot(input: string, in_angle: number, low: number, high: number): number {
        let parts = input.split(",")

        let k_x2 = parseInt(parts[0])
        let k_y2 = parseInt(parts[1])
        let k_s2 = parseInt(parts[2])
        let k_b12 = parseInt(parts[3])
        let k_b22 = parseInt(parts[4])
        let k_b32 = parseInt(parts[5])
        let k_b42 = parseInt(parts[6])

        let center = 512
        let deadzone = 40

        // Normalize inputs to -1 to 1
        let x = (k_x2 - center) / center
        let y = (k_y2 - center) / center

        // Apply deadzone
        if (Math.abs(x) < deadzone / center) x = 0
        if (Math.abs(y) < deadzone / center) y = 0

        // Combine movement
        // Differential drive logic: 
        // Left = y + x, Right = y - x
        let leftPower = -(y + x)
        let rightPower = -(y - x)

        // Clamp to [-1, 1]
        leftPower = Math.max(-1, Math.min(1, leftPower))
        rightPower = Math.max(-1, Math.min(1, rightPower))

        let L_Speed = 1023
        let R_Speed = 1023

        let L_pwm_fwd = 0, L_pwm_bwd = 0
        let R_pwm_fwd = 0, R_pwm_bwd = 0

        // Convert to forward/backward PWM values
        if (leftPower >= 0) {
            L_pwm_fwd = L_Speed * leftPower
        } else {
            L_pwm_bwd = L_Speed * -leftPower
        }

        if (rightPower >= 0) {
            R_pwm_fwd = R_Speed * rightPower
        } else {
            R_pwm_bwd = R_Speed * -rightPower
        }

        // Stop condition
        if (x == 0 && y == 0) {
            L_pwm_fwd = 0
            L_pwm_bwd = 0
            R_pwm_fwd = 0
            R_pwm_bwd = 0
        }

        // Button overrides
        if (k_b12 == 0) {
            // Turn left
            pins.analogWritePin(AnalogPin.P13, 0)
            pins.analogWritePin(AnalogPin.P12, 200)
            pins.analogWritePin(AnalogPin.P15, 200)
            pins.analogWritePin(AnalogPin.P14, 0)
            basic.pause(5)
        }

        if (k_b42 == 0) {
            // Turn right
            pins.analogWritePin(AnalogPin.P13, 200)
            pins.analogWritePin(AnalogPin.P12, 0)
            pins.analogWritePin(AnalogPin.P15, 0)
            pins.analogWritePin(AnalogPin.P14, 200)
            basic.pause(5)
        }

        if (k_b22 == 0) {
            in_angle = high
        }

        if (k_b32 == 0) {
            in_angle = low
        }

        // Apply final motor PWM values
        pins.analogWritePin(AnalogPin.P13, L_pwm_fwd)
        pins.analogWritePin(AnalogPin.P12, L_pwm_bwd)
        pins.analogWritePin(AnalogPin.P15, R_pwm_fwd)
        pins.analogWritePin(AnalogPin.P14, R_pwm_bwd)

        return in_angle
    }



    //% block
    //% LeftMotorPin1.defl=12
    //% LeftMotorPin2.defl=13
    //% RightMotorPin1.defl=14
    //% RightMotorPin2.defl=15
    //% blockId="KuangRobot_motorDriverPins" block="Motor Driver Pin | Left Motor=  %LeftMotorPin1 %LeftMotorPin2 | Right Motor= %RightMotorPin1 %RightMotorPin2"
    export function motorDriverPins(LeftMotorPin1: AnalogPin, LeftMotorPin2: AnalogPin, RightMotorPin1: AnalogPin, RightMotorPin2: AnalogPin): void {

    }

    //% block
    //% blockId="servo" block="Target Servo Angle: %targetAngle  Current Servo Angle: %currentAngle ServoPin: %servoPin"
    export function servoMove(targetAngle: number, currentAngle:number, servoPin: AnalogPin) : number {
        if (targetAngle != currentAngle) {
            currentAngle = targetAngle
            pins.servoWritePin(servoPin, currentAngle)
            basic.pause(500)
        }
        return currentAngle
    }
}
