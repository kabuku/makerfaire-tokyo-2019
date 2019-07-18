import time
import pprint
import pygame
import paho.mqtt.client as mqtt

DUTY_CYCLE_MAX = 12
DUTY_CYCLE_MIN = 2.5
LEFT_WEIGHTING_VALUE = 1
RIGHT_WEIGHTING_VALUE = 1
AXIS_THRESHOLD = 0.05


def get_max_duty_cycle_left():
    return DUTY_CYCLE_MAX - 4


def get_max_duty_cycle_right():
    return DUTY_CYCLE_MAX - 0


def get_min_duty_cycle_left():
    return DUTY_CYCLE_MIN + 0


def get_min_duty_cycle_right():
    return DUTY_CYCLE_MIN + 0


# def get_duty_cycle_right(duty_cycle):
#     return duty_cycle * RIGHT_WEIGHTING_VALUE


class JCU3712FBKController(object):

    def __init__(self):

        pygame.init()
        pygame.joystick.init()
        self.controller = pygame.joystick.Joystick(0)
        self.controller.init()
        self.axis_data = {}

    def listen(self, client):

        try:
            previous_left_servo = None
            previous_right_servo = None
            while True:
                # e = pygame.event.get()
                # pprint.pprint(e)
                # pprint.pprint(pygame.event.get())
                for event in pygame.event.get():
                    # pprint.pprint(event)
                    # if event.type == pygame.BUTTON_WHEELUP:
                    #     self.axis_data[event.axis] = event.value

                    if event.type == pygame.JOYAXISMOTION:
                        print("{} {}".format(event.axis, event.value))

                # if self.axis_data:
                #     x = float(self.axis_data[1] - 0.06)
                #     y = float(self.axis_data[0])
                #     # print(self.axis_data)
                #     left_servo = 0
                #     right_servo = 0
                #     # print("x:{},y:{}".format(x, y))
                #     if x <= -AXIS_THRESHOLD:
                #         left_servo = get_max_duty_cycle_left()
                #         right_servo = get_min_duty_cycle_right()
                #     elif x >= AXIS_THRESHOLD:
                #         left_servo = get_min_duty_cycle_left()
                #         right_servo = get_max_duty_cycle_right()
                #
                #     elif y >= AXIS_THRESHOLD + 0.01:
                #         print(y)
                #         print("a")
                #         left_servo = DUTY_CYCLE_MAX - 4
                #         right_servo = DUTY_CYCLE_MAX - 2
                #     elif y <= -AXIS_THRESHOLD + 0.01:
                #         print(y)
                #         left_servo = DUTY_CYCLE_MIN + 2
                #         right_servo = DUTY_CYCLE_MIN + 2

                    # if left_servo != previous_left_servo or right_servo != previous_right_servo:
                    # if previous_left_servo == 0 and left_servo == 0:
                    #     continue
                    # client.publish("nobunaga/servos", "{},{}".format(left_servo, right_servo))
                    # # print("{}:{}".format(left_servo, right_servo))
                    # previous_left_servo = left_servo
                    # previous_right_servo = right_servo

                client.loop()
                # time.sleep(0.05)

        except KeyboardInterrupt:
            pass

        client.publish("nobunaga/right", "0")
        client.publish("nobunaga/left", "0")
        client.disconnect()


def on_message(client, userdata, msg):
    print(msg.topic + " " + str(msg.payload))


def main():
    client = mqtt.Client()
    client.connect("localhost", 1883, 60)
    ps4 = JCU3712FBKController()
    ps4.listen(client)


if __name__ == "__main__":
    main()
