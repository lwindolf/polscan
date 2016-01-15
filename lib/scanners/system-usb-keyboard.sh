# group: System
# name: USB Keyboard
# description: On server systems USB keyboards are not normal. So you might want to know when on is attached

# Example: Oct 29 11:28:23 srv1 kernel: [59270631.727430] generic-usb 0003:0624:0248.000B: input,hidraw0: USB HID v1.00 Keyboard [Avocent USB Composite Device-0] on usb-0000:00:12.0-2/input0
output=$(/bin/dmesg 2>/dev/null| grep -i "generic-usb:.*USB.*HID.*Keyboard")
if [ "$output" == "" ]; then
	result_ok
else
	result_warning "USB keyboard found: $output"
fi
