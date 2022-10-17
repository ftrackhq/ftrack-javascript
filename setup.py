# :coding: utf-8
# :copyright: Copyright (c) 2016 ftrack

import os
import re
import json

from setuptools import setup, find_packages
from setuptools.command.test import test as TestCommand


ROOT_PATH = os.path.dirname(os.path.realpath(__file__))
SOURCE_PATH = os.path.join(ROOT_PATH, 'source')
README_PATH = os.path.join(ROOT_PATH, 'README.md')

# Read version from source.
with open(
    os.path.join(os.path.dirname(__file__), 'package.json')
) as package_file:
    package = json.load(package_file)
    VERSION = package.get('version')


# Configuration.
setup(
    name='ftrack-javascript-api',
    version=VERSION,
    description='Javascript api for ftrack.com',
    long_description=open(README_PATH).read(),
    keywords='ftrack',
    url='https://github.com/ftrackhq/javascript-api',
    author='ftrack',
    author_email='support@ftrack.com',
    license='Apache License (2.0)',
    packages=find_packages(SOURCE_PATH),
    package_dir={
        '': 'source'
    },
    setup_requires=[
        'sphinx >= 1.2.2, < 2',
        'sphinx_rtd_theme >= 0.1.6, < 2',
        'lowdown >= 0.1.0, < 2'
    ],
    install_requires=[
    ],
    tests_require=[
        'pytest >= 2.3.5, < 3'
    ],
    cmdclass={
    },
    zip_safe=False
)
